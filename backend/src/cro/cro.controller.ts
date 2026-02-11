import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { CROService } from './cro.service'
import { PageType, CROInsightSeverity } from './entities/cro-insight.entity'

@Controller('cro')
export class CROController {
  constructor(private readonly croService: CROService) {}
  /**
   * Check if merchant has CRO tool installed
   */
  @Get(':merchantId/installation-status')
  async getInstallationStatus(@Param('merchantId') merchantId: string) {
    return await this.croService.checkCROToolInstallation(merchantId)
  }

  /**
   * Get CRO insights for merchant
   */
  @Get(':merchantId/insights')
  async getInsights(
    @Param('merchantId') merchantId: string,
    @Query('pageType') pageType?: PageType,
    @Query('severity') severity?: CROInsightSeverity,
    @Query('resolved') resolved?: string,
  ) {
    const filters: any = {}
    if (pageType) {
      filters.pageType = pageType
    }
    if (severity) {
      filters.severity = severity
    }
    if (resolved !== undefined) {
      filters.resolved = resolved === 'true'
    }
    return await this.croService.getInsights(merchantId, filters)
  }

  /**
   * Get insights summary
   */
  @Get(':merchantId/insights/summary')
  async getInsightsSummary(@Param('merchantId') merchantId: string) {
    return await this.croService.getInsightsSummary(merchantId)
  }

  /**
   * Get checkout-specific friction points
   */
  @Get(':merchantId/checkout-friction')
  async getCheckoutFriction(@Param('merchantId') merchantId: string) {
    return await this.croService.getCheckoutFrictionPoints(merchantId)
  }

  /**
   * Mark insight as resolved
   */
  @Post(':merchantId/insights/:insightId/resolve')
  async resolveInsight(
    @Param('insightId') insightId: string,
    @Body('note') note?: string,
  ) {
    return await this.croService.resolveInsight(insightId, note)
  }

  /**
   * Manually trigger sync from Clarity
   */
  @Post(':merchantId/sync')
  async syncInsights(@Param('merchantId') merchantId: string) {
    await this.croService.syncClarityInsights(merchantId)
    return { success: true }
  }
}
