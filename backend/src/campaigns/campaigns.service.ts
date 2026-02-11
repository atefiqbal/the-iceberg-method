import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  Campaign,
  CampaignType,
  CampaignStatus,
  SegmentTarget,
} from './entities/campaign.entity'
import { GatesService } from '../gates/gates.service'
import { GateType } from '../gates/entities/gate-state.entity'
import { GateStatus } from '../gates/entities/gate-state.entity'
import { KlaviyoService } from '../klaviyo/klaviyo.service'
import { CustomersService } from '../customers/customers.service'

interface CreateCampaignDto {
  name: string
  campaignType: CampaignType
  segmentTarget: SegmentTarget
  subject: string
  preheader?: string
  bodyHtml: string
  bodyPlaintext: string
  promoCode?: string
  discountType?: string
  discountValue?: number
  promoExpiresAt?: Date
  scheduledAt?: Date
  overrideGate?: boolean
  overrideReason?: string
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name)

  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private gatesService: GatesService,
    private klaviyoService: KlaviyoService,
    private customersService: CustomersService,
  ) {}

  /**
   * Create a new campaign with gate enforcement
   */
  async createCampaign(
    merchantId: string,
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<Campaign> {
    // Enforce deliverability gate for promotional campaigns
    if (dto.campaignType === CampaignType.PROMOTION && !dto.overrideGate) {
      const gateCheck = await this.gatesService.checkGate(
        merchantId,
        'deliverability',
      )

      if (gateCheck.status === GateStatus.FAIL) {
        throw new ForbiddenException({
          error: 'Gate violation',
          gateType: 'deliverability',
          message:
            'Deliverability gate failed. Promotions are blocked to protect sender reputation.',
          metrics: gateCheck.metrics,
          canOverride: true,
          overrideWarning:
            'Proceeding may damage sender reputation and reduce revenue.',
        })
      }
    }

    // Create campaign
    const campaign = this.campaignRepository.create({
      merchantId,
      name: dto.name,
      campaignType: dto.campaignType,
      segmentTarget: dto.segmentTarget,
      subject: dto.subject,
      preheader: dto.preheader,
      bodyHtml: dto.bodyHtml,
      bodyPlaintext: dto.bodyPlaintext,
      promoCode: dto.promoCode,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      promoExpiresAt: dto.promoExpiresAt,
      scheduledAt: dto.scheduledAt,
      status: dto.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
    })

    // Handle gate override if provided
    if (dto.overrideGate) {
      if (!dto.overrideReason) {
        throw new BadRequestException('Override reason is required')
      }

      campaign.gateOverridden = true
      campaign.gateOverrideReason = dto.overrideReason
      campaign.gateOverrideUserId = userId
      campaign.gateOverrideAt = new Date()

      // Log override for audit trail
      await this.gatesService.logGateOverride(
        merchantId,
        GateType.DELIVERABILITY,
        userId,
        dto.overrideReason || 'Campaign override',
      )

      this.logger.warn(
        `Gate overridden for campaign ${campaign.id} by user ${userId}: ${dto.overrideReason}`,
      )
    }

    const saved = await this.campaignRepository.save(campaign)

    this.logger.log(
      `Campaign ${saved.id} created for merchant ${merchantId} (type: ${dto.campaignType})`,
    )

    return saved
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new BadRequestException(`Campaign ${campaignId} not found`)
    }

    return campaign
  }

  /**
   * Get all campaigns for a merchant
   */
  async getCampaigns(
    merchantId: string,
    filters?: {
      status?: CampaignStatus
      campaignType?: CampaignType
    },
  ): Promise<Campaign[]> {
    const where: any = { merchantId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.campaignType) {
      where.campaignType = filters.campaignType
    }

    return await this.campaignRepository.find({
      where,
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Send campaign immediately or schedule for later
   */
  async sendCampaign(campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId)

    if (campaign.status === CampaignStatus.SENT) {
      throw new BadRequestException('Campaign already sent')
    }

    if (campaign.status === CampaignStatus.CANCELLED) {
      throw new BadRequestException('Campaign is cancelled')
    }

    // Re-check gate before sending (in case status changed)
    if (
      campaign.campaignType === CampaignType.PROMOTION &&
      !campaign.gateOverridden
    ) {
      const gateCheck = await this.gatesService.checkGate(
        campaign.merchantId,
        'deliverability',
      )

      if (gateCheck.status === GateStatus.FAIL) {
        throw new ForbiddenException(
          'Deliverability gate failed. Cannot send promotional campaign.',
        )
      }
    }

    // Calculate recipient count based on segment
    const recipientCount = await this.calculateRecipientCount(
      campaign.merchantId,
      campaign.segmentTarget,
    )

    campaign.recipientCount = recipientCount
    campaign.status = CampaignStatus.SENDING
    await this.campaignRepository.save(campaign)

    try {
      // Send via Klaviyo (or other ESP)
      const espCampaignId = await this.sendViaESP(campaign)

      campaign.espCampaignId = espCampaignId
      campaign.status = CampaignStatus.SENT
      campaign.sentAt = new Date()
      campaign.sentCount = recipientCount

      await this.campaignRepository.save(campaign)

      this.logger.log(
        `Campaign ${campaign.id} sent to ${recipientCount} recipients`,
      )
    } catch (error) {
      campaign.status = CampaignStatus.DRAFT
      await this.campaignRepository.save(campaign)

      this.logger.error(
        `Failed to send campaign ${campaign.id}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Calculate how many recipients will receive the campaign
   */
  private async calculateRecipientCount(
    merchantId: string,
    segmentTarget: SegmentTarget,
  ): Promise<number> {
    // This would query the customers table based on segment
    // For now, return a mock number
    switch (segmentTarget) {
      case SegmentTarget.ALL_SUBSCRIBERS:
        return 1000 // Mock
      case SegmentTarget.POST_PURCHASE:
        return 600
      case SegmentTarget.PRE_PURCHASE:
        return 400
      case SegmentTarget.PRODUCT_STEP_1:
        return 300
      case SegmentTarget.PRODUCT_STEP_2:
        return 200
      case SegmentTarget.PRODUCT_STEP_3:
        return 100
      case SegmentTarget.INACTIVE_CUSTOMERS:
        return 250
      default:
        return 0
    }
  }

  /**
   * Send campaign via ESP (Klaviyo)
   */
  private async sendViaESP(campaign: Campaign): Promise<string> {
    // In production, this would use Klaviyo's campaign API
    // For now, return a mock campaign ID
    this.logger.log(
      `Sending campaign ${campaign.id} via ESP (${campaign.segmentTarget})`,
    )

    // Mock ESP campaign ID
    return `klaviyo-campaign-${Date.now()}`
  }

  /**
   * Update campaign performance metrics from ESP webhooks
   */
  async updateCampaignMetrics(
    campaignId: string,
    metrics: {
      openedCount?: number
      clickedCount?: number
      revenueGenerated?: number
    },
  ): Promise<void> {
    const campaign = await this.getCampaign(campaignId)

    if (metrics.openedCount !== undefined) {
      campaign.openedCount = metrics.openedCount
    }

    if (metrics.clickedCount !== undefined) {
      campaign.clickedCount = metrics.clickedCount
    }

    if (metrics.revenueGenerated !== undefined) {
      campaign.revenueGenerated = metrics.revenueGenerated
    }

    await this.campaignRepository.save(campaign)
  }

  /**
   * Get campaign performance summary
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    recipientCount: number
    sentCount: number
    openRate: number
    clickRate: number
    clickToOpenRate: number
    revenueGenerated: number
    revenuePerRecipient: number
  }> {
    const campaign = await this.getCampaign(campaignId)

    const openRate =
      campaign.sentCount > 0
        ? campaign.openedCount / campaign.sentCount
        : 0

    const clickRate =
      campaign.sentCount > 0
        ? campaign.clickedCount / campaign.sentCount
        : 0

    const clickToOpenRate =
      campaign.openedCount > 0
        ? campaign.clickedCount / campaign.openedCount
        : 0

    const revenuePerRecipient =
      campaign.recipientCount > 0
        ? Number(campaign.revenueGenerated) / campaign.recipientCount
        : 0

    return {
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      openRate,
      clickRate,
      clickToOpenRate,
      revenueGenerated: Number(campaign.revenueGenerated),
      revenuePerRecipient,
    }
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelCampaign(campaignId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId)

    if (campaign.status === CampaignStatus.SENT) {
      throw new BadRequestException('Cannot cancel a sent campaign')
    }

    campaign.status = CampaignStatus.CANCELLED
    return await this.campaignRepository.save(campaign)
  }
}
