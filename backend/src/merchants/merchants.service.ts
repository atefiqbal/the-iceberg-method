import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Merchant, MerchantStatus } from './entities/merchant.entity'
import {
  MerchantIntegration,
  IntegrationProvider,
  IntegrationStatus,
} from './entities/merchant-integration.entity'
import { CreateMerchantDto } from './dto/create-merchant.dto'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(MerchantIntegration)
    private integrationsRepository: Repository<MerchantIntegration>,
  ) {}

  /**
   * Create or update merchant from Shopify OAuth
   */
  async createOrUpdate(
    createMerchantDto: CreateMerchantDto,
    shopifyAccessToken: string,
  ): Promise<Merchant> {
    // Check if merchant already exists
    let merchant = await this.merchantsRepository.findOne({
      where: { shopifyDomain: createMerchantDto.shopifyDomain },
    })

    if (merchant) {
      // Update existing merchant
      merchant.email = createMerchantDto.email
      merchant.businessName = createMerchantDto.businessName || merchant.businessName
      merchant.timezone = createMerchantDto.timezone || merchant.timezone
      merchant.status = MerchantStatus.ACTIVE
      await this.merchantsRepository.save(merchant)
    } else {
      // Create new merchant
      merchant = this.merchantsRepository.create({
        ...createMerchantDto,
        status: MerchantStatus.ACTIVE,
      })
      await this.merchantsRepository.save(merchant)
    }

    // Store encrypted Shopify access token
    await this.storeIntegration(
      merchant.id,
      IntegrationProvider.SHOPIFY,
      shopifyAccessToken,
    )

    return merchant
  }

  /**
   * Store integration with encrypted access token
   */
  async storeIntegration(
    merchantId: string,
    provider: IntegrationProvider,
    accessToken: string,
    config?: Record<string, any>,
  ): Promise<MerchantIntegration> {
    const { encrypted, iv, authTag } = this.encryptToken(accessToken)

    // Check if integration exists
    let integration = await this.integrationsRepository.findOne({
      where: { merchantId, provider },
    })

    if (integration) {
      // Update existing
      integration.encryptedToken = encrypted
      integration.iv = iv
      integration.authTag = authTag
      integration.config = config || integration.config
      integration.status = IntegrationStatus.ACTIVE
      integration.lastSyncAt = new Date()
    } else {
      // Create new
      integration = this.integrationsRepository.create({
        merchantId,
        provider,
        encryptedToken: encrypted,
        iv,
        authTag,
        config,
        status: IntegrationStatus.ACTIVE,
        lastSyncAt: new Date(),
      })
    }

    return await this.integrationsRepository.save(integration)
  }

  /**
   * Get decrypted access token for integration
   */
  async getIntegrationToken(
    merchantId: string,
    provider: IntegrationProvider,
  ): Promise<string> {
    const integration = await this.integrationsRepository.findOne({
      where: { merchantId, provider, status: IntegrationStatus.ACTIVE },
    })

    if (!integration || !integration.encryptedToken) {
      throw new NotFoundException(
        `No active ${provider} integration found for merchant`,
      )
    }

    return this.decryptToken(
      integration.encryptedToken,
      integration.iv,
      integration.authTag,
    )
  }

  /**
   * Get all integrations for merchant
   */
  async getIntegrations(merchantId: string): Promise<MerchantIntegration[]> {
    return await this.integrationsRepository.find({
      where: { merchantId },
      select: [
        'id',
        'provider',
        'status',
        'lastSyncAt',
        'createdAt',
        'config',
      ], // Exclude encrypted fields
    })
  }

  /**
   * Update integration health status
   */
  async updateIntegrationHealth(
    merchantId: string,
    provider: IntegrationProvider,
    status: IntegrationStatus,
    lastSyncAt?: Date,
  ): Promise<void> {
    await this.integrationsRepository.update(
      { merchantId, provider },
      {
        status,
        lastSyncAt: lastSyncAt || new Date(),
      },
    )
  }

  /**
   * Find merchant by ID
   */
  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({
      where: { id },
    })

    if (!merchant) {
      throw new NotFoundException('Merchant not found')
    }

    return merchant
  }

  /**
   * Alias for findOne (used by jobs)
   */
  async findById(id: string): Promise<Merchant> {
    return this.findOne(id)
  }

  /**
   * Find all merchants with optional filters
   */
  async findAll(filters?: { status?: MerchantStatus }): Promise<Merchant[]> {
    return await this.merchantsRepository.find({
      where: filters,
    })
  }

  /**
   * Find merchant by Shopify domain
   */
  async findByShopifyDomain(shopifyDomain: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({
      where: { shopifyDomain },
    })

    if (!merchant) {
      throw new NotFoundException('Merchant not found')
    }

    return merchant
  }

  /**
   * Encrypt access token using AES-256-GCM
   */
  private encryptToken(token: string): {
    encrypted: string
    iv: string
    authTag: string
  } {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
    const key = Buffer.from(encryptionKey, 'hex')
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  }

  /**
   * Decrypt access token
   */
  private decryptToken(
    encrypted: string,
    ivHex: string,
    authTagHex: string,
  ): string {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
    const key = Buffer.from(encryptionKey, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Get all active merchants (for background jobs)
   */
  async findAllActive(): Promise<Merchant[]> {
    return await this.merchantsRepository.find({
      where: { status: MerchantStatus.ACTIVE },
    })
  }
}
