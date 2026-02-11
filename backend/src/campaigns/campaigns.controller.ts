import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CampaignType, CampaignStatus, SegmentTarget } from './entities/campaign.entity'

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
  /**
   * Create a new campaign
   */
  @Post(':merchantId')
  async createCampaign(
    @Param('merchantId') merchantId: string,
    @Body()
    body: {
      userId: string
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
      promoExpiresAt?: string
      scheduledAt?: string
      overrideGate?: boolean
      overrideReason?: string
    },
  ) {
    return await this.campaignsService.createCampaign(merchantId, body.userId, {
      name: body.name,
      campaignType: body.campaignType,
      segmentTarget: body.segmentTarget,
      subject: body.subject,
      preheader: body.preheader,
      bodyHtml: body.bodyHtml,
      bodyPlaintext: body.bodyPlaintext,
      promoCode: body.promoCode,
      discountType: body.discountType,
      discountValue: body.discountValue,
      promoExpiresAt: body.promoExpiresAt ? new Date(body.promoExpiresAt) : undefined,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      overrideGate: body.overrideGate,
      overrideReason: body.overrideReason,
    })
  }
  /**
   * Get all campaigns for merchant
   */
  @Get(':merchantId')
  async getCampaigns(
    @Param('merchantId') merchantId: string,
    @Query('status') status?: CampaignStatus,
    @Query('campaignType') campaignType?: CampaignType,
  ) {
    return await this.campaignsService.getCampaigns(merchantId, {
      status,
      campaignType,
    })
  }
  /**
   * Get specific campaign
   */
  @Get(':merchantId/:campaignId')
  async getCampaign(@Param('campaignId') campaignId: string) {
    return await this.campaignsService.getCampaign(campaignId)
  }
  /**
   * Send campaign
   */
  @Post(':merchantId/:campaignId/send')
  async sendCampaign(@Param('campaignId') campaignId: string) {
    await this.campaignsService.sendCampaign(campaignId)
    return { success: true }
  }
  /**
   * Cancel campaign
   */
  @Post(':merchantId/:campaignId/cancel')
  async cancelCampaign(@Param('campaignId') campaignId: string) {
    return await this.campaignsService.cancelCampaign(campaignId)
  }
  /**
   * Get campaign performance
   */
  @Get(':merchantId/:campaignId/performance')
  async getCampaignPerformance(@Param('campaignId') campaignId: string) {
    return await this.campaignsService.getCampaignPerformance(campaignId)
  }
}
