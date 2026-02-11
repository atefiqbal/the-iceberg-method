import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CROInsight,
  CROInsightType,
  CROInsightSeverity,
  PageType,
} from './entities/cro-insight.entity'
import { MerchantsService } from '../merchants/merchants.service'
import { IntegrationProvider } from '../merchants/entities/merchant-integration.entity'

interface ClarityInsight {
  type: string
  pageUrl: string
  selector: string
  count: number
  sessions: Array<{
    id: string
    recordingUrl: string
  }>
}

@Injectable()
export class CROService {
  private readonly logger = new Logger(CROService.name)

  constructor(
    @InjectRepository(CROInsight)
    private insightRepository: Repository<CROInsight>,
    private merchantsService: MerchantsService,
  ) {}

  /**
   * Check if merchant has a CRO tool installed
   */
  async checkCROToolInstallation(merchantId: string): Promise<{
    installed: boolean
    provider?: 'clarity' | 'hotjar'
    recommendation?: string
  }> {
    const integrations = await this.merchantsService.getIntegrations(merchantId)
    const clarityIntegration = integrations.find(
      (i) => i.provider === IntegrationProvider.CLARITY,
    )
    const hotjarIntegration = integrations.find(
      (i) => i.provider === IntegrationProvider.HOTJAR,
    )

    if (clarityIntegration?.status === 'active') {
      return {
        installed: true,
        provider: 'clarity',
      }
    }

    if (hotjarIntegration?.status === 'active') {
      return {
        installed: true,
        provider: 'hotjar',
      }
    }

    return {
      installed: false,
      recommendation:
        'Install Microsoft Clarity for free behavior analytics and session recordings',
    }
  }

  /**
   * Sync CRO insights from Microsoft Clarity
   */
  async syncClarityInsights(merchantId: string): Promise<void> {
    const integrations = await this.merchantsService.getIntegrations(merchantId)
    const integration = integrations.find(
      (i) => i.provider === IntegrationProvider.CLARITY,
    )

    if (!integration) {
      this.logger.warn(`No Clarity integration for merchant ${merchantId}`)
      return
    }

    const projectId = integration.config?.projectId

    if (!projectId) {
      this.logger.warn(`No Clarity project ID for merchant ${merchantId}`)
      return
    }

    try {
      // Fetch rage clicks from Clarity API
      const rageClicks = await this.fetchClarityRageClicks(projectId)

      // Store insights
      for (const rageClick of rageClicks) {
        await this.createOrUpdateInsight(merchantId, {
          insightType: CROInsightType.RAGE_CLICK,
          pageUrl: rageClick.pageUrl,
          elementSelector: rageClick.selector,
          occurrences: rageClick.count,
          sessionUrls: rageClick.sessions.map((s) => s.recordingUrl),
          pageType: this.determinePageType(rageClick.pageUrl),
          severity: this.calculateSeverity(rageClick.count, rageClick.pageUrl),
          description: `Users rapidly clicked "${rageClick.selector}" ${rageClick.count} times, indicating frustration`,
        })
      }

      // Fetch dead clicks
      const deadClicks = await this.fetchClarityDeadClicks(projectId)

      for (const deadClick of deadClicks) {
        await this.createOrUpdateInsight(merchantId, {
          insightType: CROInsightType.DEAD_CLICK,
          pageUrl: deadClick.pageUrl,
          elementSelector: deadClick.selector,
          occurrences: deadClick.count,
          sessionUrls: deadClick.sessions.map((s) => s.recordingUrl),
          pageType: this.determinePageType(deadClick.pageUrl),
          severity: this.calculateSeverity(deadClick.count, deadClick.pageUrl),
          description: `Users clicked "${deadClick.selector}" but nothing happened (${deadClick.count} times)`,
        })
      }

      this.logger.log(
        `Synced ${rageClicks.length + deadClicks.length} CRO insights for merchant ${merchantId}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to sync Clarity insights for merchant ${merchantId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Fetch rage clicks from Microsoft Clarity API
   */
  private async fetchClarityRageClicks(
    projectId: string,
  ): Promise<ClarityInsight[]> {
    // Microsoft Clarity API integration
    // Note: Clarity doesn't have a public API yet (as of 2024)
    // This is a placeholder for when the API becomes available
    // For now, merchants would need to manually review Clarity dashboard

    // Mock data for development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          type: 'rage_click',
          pageUrl: '/checkout',
          selector: 'button.submit-payment',
          count: 15,
          sessions: [
            {
              id: 'session-123',
              recordingUrl: 'https://clarity.microsoft.com/session/123',
            },
          ],
        },
        {
          type: 'rage_click',
          pageUrl: '/cart',
          selector: 'input.discount-code',
          count: 8,
          sessions: [
            {
              id: 'session-456',
              recordingUrl: 'https://clarity.microsoft.com/session/456',
            },
          ],
        },
      ]
    }

    // TODO: Implement actual Clarity API integration when available
    return []
  }

  /**
   * Fetch dead clicks from Microsoft Clarity API
   */
  private async fetchClarityDeadClicks(
    projectId: string,
  ): Promise<ClarityInsight[]> {
    // Mock data for development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          type: 'dead_click',
          pageUrl: '/products/premium-kit',
          selector: 'div.product-image',
          count: 12,
          sessions: [
            {
              id: 'session-789',
              recordingUrl: 'https://clarity.microsoft.com/session/789',
            },
          ],
        },
      ]
    }

    return []
  }

  /**
   * Create or update a CRO insight
   */
  private async createOrUpdateInsight(
    merchantId: string,
    data: {
      insightType: CROInsightType
      pageUrl: string
      elementSelector: string
      occurrences: number
      sessionUrls: string[]
      pageType: PageType
      severity: CROInsightSeverity
      description: string
    },
  ): Promise<CROInsight> {
    // Check if insight already exists (same type, page, selector)
    const existing = await this.insightRepository.findOne({
      where: {
        merchantId,
        insightType: data.insightType,
        pageUrl: data.pageUrl,
        elementSelector: data.elementSelector,
        resolved: false,
      },
    })

    if (existing) {
      // Update existing insight
      existing.occurrences = data.occurrences
      existing.sessionUrls = data.sessionUrls
      existing.severity = data.severity
      return await this.insightRepository.save(existing)
    }

    // Create new insight
    const insight = this.insightRepository.create({
      merchantId,
      ...data,
    })

    return await this.insightRepository.save(insight)
  }

  /**
   * Determine page type from URL
   */
  private determinePageType(url: string): PageType {
    if (url === '/' || url.includes('index')) return PageType.HOMEPAGE
    if (url.includes('/checkout')) return PageType.CHECKOUT
    if (url.includes('/cart')) return PageType.CART
    if (url.includes('/products/')) return PageType.PRODUCT
    if (url.includes('/collections/')) return PageType.COLLECTION
    return PageType.OTHER
  }

  /**
   * Calculate severity based on occurrence count and page type
   */
  private calculateSeverity(
    count: number,
    pageUrl: string,
  ): CROInsightSeverity {
    const pageType = this.determinePageType(pageUrl)

    // Checkout issues are critical
    if (pageType === PageType.CHECKOUT) {
      if (count >= 10) return CROInsightSeverity.CRITICAL
      if (count >= 5) return CROInsightSeverity.HIGH
      return CROInsightSeverity.MEDIUM
    }

    // Cart issues are high priority
    if (pageType === PageType.CART) {
      if (count >= 15) return CROInsightSeverity.CRITICAL
      if (count >= 10) return CROInsightSeverity.HIGH
      if (count >= 5) return CROInsightSeverity.MEDIUM
      return CROInsightSeverity.LOW
    }

    // Product page issues
    if (pageType === PageType.PRODUCT) {
      if (count >= 20) return CROInsightSeverity.HIGH
      if (count >= 10) return CROInsightSeverity.MEDIUM
      return CROInsightSeverity.LOW
    }

    // Other pages
    if (count >= 25) return CROInsightSeverity.HIGH
    if (count >= 15) return CROInsightSeverity.MEDIUM
    return CROInsightSeverity.LOW
  }

  /**
   * Get all unresolved CRO insights for a merchant
   */
  async getInsights(
    merchantId: string,
    filters?: {
      pageType?: PageType
      severity?: CROInsightSeverity
      resolved?: boolean
    },
  ): Promise<CROInsight[]> {
    const where: any = { merchantId }

    if (filters?.pageType) {
      where.pageType = filters.pageType
    }

    if (filters?.severity) {
      where.severity = filters.severity
    }

    if (filters?.resolved !== undefined) {
      where.resolved = filters.resolved
    } else {
      where.resolved = false // Default to unresolved
    }

    return await this.insightRepository.find({
      where,
      order: {
        severity: 'DESC',
        occurrences: 'DESC',
        createdAt: 'DESC',
      },
    })
  }

  /**
   * Get insights summary grouped by page type
   */
  async getInsightsSummary(merchantId: string): Promise<{
    total: number
    byPageType: Record<string, number>
    bySeverity: Record<string, number>
    criticalCheckoutIssues: number
  }> {
    const insights = await this.getInsights(merchantId, { resolved: false })

    const summary = {
      total: insights.length,
      byPageType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      criticalCheckoutIssues: 0,
    }

    insights.forEach((insight) => {
      // Count by page type
      summary.byPageType[insight.pageType] =
        (summary.byPageType[insight.pageType] || 0) + 1

      // Count by severity
      summary.bySeverity[insight.severity] =
        (summary.bySeverity[insight.severity] || 0) + 1

      // Count critical checkout issues
      if (
        insight.pageType === PageType.CHECKOUT &&
        insight.severity === CROInsightSeverity.CRITICAL
      ) {
        summary.criticalCheckoutIssues += 1
      }
    })

    return summary
  }

  /**
   * Mark insight as resolved
   */
  async resolveInsight(
    insightId: string,
    resolvedNote?: string,
  ): Promise<CROInsight> {
    const insight = await this.insightRepository.findOne({
      where: { id: insightId },
    })

    if (!insight) {
      throw new Error(`Insight ${insightId} not found`)
    }

    insight.resolved = true
    insight.resolvedAt = new Date()
    if (resolvedNote) {
      insight.resolvedNote = resolvedNote
    }

    return await this.insightRepository.save(insight)
  }

  /**
   * Get checkout friction points specifically
   */
  async getCheckoutFrictionPoints(merchantId: string): Promise<CROInsight[]> {
    return await this.getInsights(merchantId, {
      pageType: PageType.CHECKOUT,
      resolved: false,
    })
  }
}
