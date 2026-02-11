import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { MerchantsService } from '../merchants/merchants.service'
import { ConfigService } from '@nestjs/config'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private merchantsService: MerchantsService,
    private configService: ConfigService,
    @InjectQueue('data-backfill')
    private backfillQueue: Queue,
  ) {}

  /**
   * Generate Shopify OAuth authorization URL
   */
  generateShopifyAuthUrl(shop: string): { authUrl: string; state: string } {
    // Normalize shop domain
    const shopDomain = shop.includes('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`

    // Validate shop domain format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopDomain)) {
      throw new BadRequestException('Invalid shop domain format')
    }

    const clientId = this.configService.get('SHOPIFY_API_KEY')
    const scopes = this.configService.get('SHOPIFY_SCOPES')
    const redirectUri = `${this.configService.get('APP_URL')}/auth/shopify/callback`

    if (!clientId) {
      throw new Error('Shopify OAuth not configured')
    }

    // Generate random state for CSRF protection
    const state = this.generateRandomState()

    // Construct Shopify OAuth URL
    const authUrl =
      `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`

    return { authUrl, state }
  }

  /**
   * Exchange Shopify authorization code for access token
   */
  async exchangeShopifyCode(
    code: string,
    shop: string,
  ): Promise<string> {
    const clientId = this.configService.get('SHOPIFY_API_KEY')
    const clientSecret = this.configService.get('SHOPIFY_API_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Shopify OAuth credentials not configured')
    }

    try {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })

      if (!response.ok) {
        throw new Error(`Shopify token exchange failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Token exchange error:', error)
      throw new UnauthorizedException('Failed to exchange authorization code')
    }
  }

  /**
   * Complete Shopify OAuth and create/update merchant
   */
  async completeShopifyOAuth(
    code: string,
    shop: string,
  ): Promise<{ merchant: any; token: string }> {
    // Exchange code for access token
    const accessToken = await this.exchangeShopifyCode(code, shop)

    // Fetch shop info from Shopify
    const shopInfo = await this.fetchShopifyShopInfo(shop, accessToken)

    // Create or update merchant
    const merchant = await this.merchantsService.createOrUpdate(
      {
        shopifyDomain: shop,
        email: shopInfo.email,
        businessName: shopInfo.name,
        timezone: shopInfo.iana_timezone || 'America/New_York',
      },
      accessToken,
    )

    // Trigger 90-day historical backfill (async, don't wait)
    await this.backfillQueue.add(
      'backfill',
      { merchantId: merchant.id, days: 90 },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        timeout: 600000, // 10 minutes
      },
    )

    // Generate JWT for session
    const token = this.generateJWT(merchant.id)

    return {
      merchant: {
        id: merchant.id,
        shopDomain: merchant.shopifyDomain,
        email: merchant.email,
        businessName: merchant.businessName,
        status: merchant.status,
      },
      token,
    }
  }

  /**
   * Fetch shop information from Shopify API
   */
  private async fetchShopifyShopInfo(
    shop: string,
    accessToken: string,
  ): Promise<any> {
    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch shop info: ${response.statusText}`)
      }

      const data = await response.json()
      return data.shop
    } catch (error) {
      console.error('Fetch shop info error:', error)
      // Return minimal info if API call fails
      return {
        email: 'unknown@example.com',
        name: shop.replace('.myshopify.com', ''),
        iana_timezone: 'America/New_York',
      }
    }
  }

  /**
   * Generate JWT token for merchant session
   */
  generateJWT(merchantId: string): string {
    const payload = {
      merchantId,
      iat: Math.floor(Date.now() / 1000),
    }

    return this.jwtService.sign(payload)
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token)
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    )
  }

  /**
   * Generate development token (development only)
   * Returns a valid JWT for the test merchant
   */
  async generateDevToken(): Promise<{ accessToken: string; merchantId: string }> {
    // Get test merchant or use the one from seed script
    const testMerchant = await this.merchantsService.findByShopifyDomain(
      'test-store.myshopify.com',
    )

    if (!testMerchant) {
      throw new Error(
        'Test merchant not found. Run: npx ts-node scripts/seed-test-data.ts',
      )
    }

    const accessToken = this.generateJWT(testMerchant.id)

    return {
      accessToken,
      merchantId: testMerchant.id,
    }
  }
}
