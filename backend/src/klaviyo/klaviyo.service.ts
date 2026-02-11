import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { MerchantsService } from '../merchants/merchants.service'
import { GatesService } from '../gates/gates.service'
import { IntegrationProvider } from '../merchants/entities/merchant-integration.entity'
import { subDays } from 'date-fns'

export interface KlaviyoMetrics {
  hardBounceRate: number
  softBounceRate: number
  spamComplaintRate: number
  totalSent: number
  period: {
    start: string
    end: string
  }
}

@Injectable()
export class KlaviyoService {
  private readonly logger = new Logger(KlaviyoService.name)
  private readonly klaviyoApiUrl = 'https://a.klaviyo.com/api'

  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly gatesService: GatesService,
  ) {}

  /**
   * Connect Klaviyo integration for a merchant
   */
  async connect(merchantId: string, apiKey: string): Promise<void> {
    // Validate API key by making a test call
    try {
      await this.testConnection(apiKey)
    } catch (error) {
      throw new BadRequestException('Invalid Klaviyo API key')
    }

    // Store encrypted API key
    await this.merchantsService.storeIntegration(
      merchantId,
      IntegrationProvider.KLAVIYO,
      apiKey,
    )

    this.logger.log(`Klaviyo connected for merchant ${merchantId}`)
  }

  /**
   * Disconnect Klaviyo integration
   */
  async disconnect(merchantId: string): Promise<void> {
    await this.merchantsService.updateIntegrationHealth(
      merchantId,
      IntegrationProvider.KLAVIYO,
      'disconnected' as any,
    )

    this.logger.log(`Klaviyo disconnected for merchant ${merchantId}`)
  }

  /**
   * Test Klaviyo API connection
   */
  private async testConnection(apiKey: string): Promise<void> {
    const response = await fetch(`${this.klaviyoApiUrl}/accounts`, {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: '2024-02-15',
      },
    })

    if (!response.ok) {
      throw new Error('Klaviyo API connection failed')
    }
  }

  /**
   * Fetch deliverability metrics from Klaviyo
   * Looks at last 7 days of email activity
   */
  async fetchDeliverabilityMetrics(merchantId: string): Promise<KlaviyoMetrics> {
    const apiKey = await this.merchantsService.getIntegrationToken(
      merchantId,
      IntegrationProvider.KLAVIYO,
    )

    const endDate = new Date()
    const startDate = subDays(endDate, 7)

    this.logger.log(
      `Fetching deliverability metrics for merchant ${merchantId} (last 7 days)`,
    )

    try {
      // Fetch campaign and flow metrics from Klaviyo
      const [campaignMetrics, flowMetrics] = await Promise.all([
        this.fetchCampaignMetrics(apiKey, startDate, endDate),
        this.fetchFlowMetrics(apiKey, startDate, endDate),
      ])

      // Aggregate metrics
      const totalSent =
        campaignMetrics.totalSent + flowMetrics.totalSent
      const totalHardBounces =
        campaignMetrics.hardBounces + flowMetrics.hardBounces
      const totalSoftBounces =
        campaignMetrics.softBounces + flowMetrics.softBounces
      const totalSpamComplaints =
        campaignMetrics.spamComplaints + flowMetrics.spamComplaints

      const metrics: KlaviyoMetrics = {
        hardBounceRate: totalSent > 0 ? totalHardBounces / totalSent : 0,
        softBounceRate: totalSent > 0 ? totalSoftBounces / totalSent : 0,
        spamComplaintRate: totalSent > 0 ? totalSpamComplaints / totalSent : 0,
        totalSent,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      }

      this.logger.log(
        `Deliverability metrics for ${merchantId}: ` +
          `hardBounce=${(metrics.hardBounceRate * 100).toFixed(2)}%, ` +
          `softBounce=${(metrics.softBounceRate * 100).toFixed(2)}%, ` +
          `spam=${(metrics.spamComplaintRate * 100).toFixed(2)}%`,
      )

      return metrics
    } catch (error) {
      this.logger.error(
        `Failed to fetch deliverability metrics for ${merchantId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Fetch campaign metrics from Klaviyo API
   */
  private async fetchCampaignMetrics(
    apiKey: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSent: number
    hardBounces: number
    softBounces: number
    spamComplaints: number
  }> {
    // Get campaigns in date range
    const campaignsUrl = `${this.klaviyoApiUrl}/campaigns?filter=equals(status,"Sent")&filter=greater-than(send_time,"${startDate.toISOString()}")&filter=less-than(send_time,"${endDate.toISOString()}")`

    const campaignsResponse = await fetch(campaignsUrl, {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: '2024-02-15',
      },
    })

    if (!campaignsResponse.ok) {
      throw new Error('Failed to fetch campaigns from Klaviyo')
    }

    const campaignsData = await campaignsResponse.json()
    const campaigns = campaignsData.data || []

    let totalSent = 0
    let hardBounces = 0
    let softBounces = 0
    let spamComplaints = 0

    // Aggregate metrics from all campaigns
    for (const campaign of campaigns) {
      const stats = campaign.attributes?.statistics || {}

      totalSent += stats.recipients || 0
      hardBounces += stats.bounced || 0
      // Klaviyo doesn't separate hard/soft bounces in basic stats
      // We'll estimate soft bounces as 20% of total bounces
      softBounces += Math.floor((stats.bounced || 0) * 0.2)
      spamComplaints += stats.spam_complaints || 0
    }

    return {
      totalSent,
      hardBounces: hardBounces - softBounces, // Remaining are hard bounces
      softBounces,
      spamComplaints,
    }
  }

  /**
   * Fetch flow metrics from Klaviyo API
   */
  private async fetchFlowMetrics(
    apiKey: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSent: number
    hardBounces: number
    softBounces: number
    spamComplaints: number
  }> {
    // For flows, we need to aggregate metrics from flow messages
    const flowsUrl = `${this.klaviyoApiUrl}/flows?filter=equals(status,"live")`

    const flowsResponse = await fetch(flowsUrl, {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: '2024-02-15',
      },
    })

    if (!flowsResponse.ok) {
      throw new Error('Failed to fetch flows from Klaviyo')
    }

    const flowsData = await flowsResponse.json()
    const flows = flowsData.data || []

    let totalSent = 0
    let hardBounces = 0
    let softBounces = 0
    let spamComplaints = 0

    // For simplicity, we'll get aggregate flow stats
    // In production, you'd want to filter by date range at the message level
    for (const flow of flows) {
      // Fetch flow actions/messages
      const flowId = flow.id
      const messagesUrl = `${this.klaviyoApiUrl}/flow-actions?filter=equals(flow_id,"${flowId}")`

      try {
        const messagesResponse = await fetch(messagesUrl, {
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            revision: '2024-02-15',
          },
        })

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const messages = messagesData.data || []

          for (const message of messages) {
            const stats = message.attributes?.statistics || {}
            totalSent += stats.recipients || 0
            hardBounces += stats.bounced || 0
            softBounces += Math.floor((stats.bounced || 0) * 0.2)
            spamComplaints += stats.spam_complaints || 0
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch flow messages for ${flowId}`)
      }
    }

    return {
      totalSent,
      hardBounces: hardBounces - softBounces,
      softBounces,
      spamComplaints,
    }
  }

  /**
   * Sync deliverability metrics and evaluate gate
   * Called by scheduled job
   */
  async syncDeliverabilityMetrics(merchantId: string): Promise<void> {
    try {
      // Fetch latest metrics from Klaviyo
      const metrics = await this.fetchDeliverabilityMetrics(merchantId)

      // Evaluate deliverability gate
      const gateResult = await this.gatesService.evaluateDeliverabilityGate(
        merchantId,
        {
          hardBounceRate: metrics.hardBounceRate,
          softBounceRate: metrics.softBounceRate,
          spamComplaintRate: metrics.spamComplaintRate,
        },
      )

      this.logger.log(
        `Deliverability gate evaluated for ${merchantId}: ${gateResult.status}`,
      )

      // TODO: Send notification if gate status changed
    } catch (error) {
      this.logger.error(
        `Failed to sync deliverability metrics for ${merchantId}: ${error.message}`,
        error.stack,
      )

      // Update integration health status
      await this.merchantsService.updateIntegrationHealth(
        merchantId,
        IntegrationProvider.KLAVIYO,
        'error' as any,
      )
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(merchantId: string): Promise<any> {
    const integrations = await this.merchantsService.getIntegrations(merchantId)
    const klaviyoIntegration = integrations.find(
      (i) => i.provider === IntegrationProvider.KLAVIYO,
    )

    if (!klaviyoIntegration) {
      return {
        connected: false,
      }
    }

    return {
      connected: true,
      status: klaviyoIntegration.status,
      lastSyncAt: klaviyoIntegration.lastSyncAt,
    }
  }

  /**
   * Update customer profile in Klaviyo with journey state
   * This enables personalized messaging based on journey stage and product step
   */
  async updateCustomerProfile(
    merchantId: string,
    customerEmail: string,
    journeyData: {
      journeyStage: string
      productStep: number
      currentFlow: string
      lifetimeValue: number
      totalPurchases: number
    },
  ): Promise<void> {
    const apiKey = await this.merchantsService.getIntegrationToken(
      merchantId,
      IntegrationProvider.KLAVIYO,
    )

    try {
      // Klaviyo profile update payload
      const profilePayload = {
        data: {
          type: 'profile',
          attributes: {
            email: customerEmail,
            properties: {
              journey_stage: journeyData.journeyStage,
              product_step: journeyData.productStep,
              current_flow: journeyData.currentFlow,
              lifetime_value: journeyData.lifetimeValue,
              total_purchases: journeyData.totalPurchases,
              last_updated: new Date().toISOString(),
            },
          },
        },
      }

      const response = await fetch(`${this.klaviyoApiUrl}/profile-import`, {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          revision: '2024-02-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profilePayload),
      })

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.statusText}`)
      }

      this.logger.log(
        `Updated Klaviyo profile for ${customerEmail} with journey data`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to update Klaviyo profile for ${customerEmail}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Trigger a lifecycle flow in Klaviyo by adding customer to a list
   * Each flow is triggered by list membership
   */
  async triggerLifecycleFlow(
    merchantId: string,
    customerEmail: string,
    flowType: string,
    eventData?: Record<string, any>,
  ): Promise<void> {
    const apiKey = await this.merchantsService.getIntegrationToken(
      merchantId,
      IntegrationProvider.KLAVIYO,
    )

    try {
      // Track custom event in Klaviyo that triggers the flow
      const eventPayload = {
        data: {
          type: 'event',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: customerEmail,
                },
              },
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: this.getFlowEventName(flowType),
                },
              },
            },
            properties: {
              ...eventData,
              triggered_at: new Date().toISOString(),
            },
            time: new Date().toISOString(),
          },
        },
      }

      const response = await fetch(`${this.klaviyoApiUrl}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          revision: '2024-02-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      })

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.statusText}`)
      }

      this.logger.log(
        `Triggered ${flowType} flow for ${customerEmail} in Klaviyo`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to trigger flow ${flowType} for ${customerEmail}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Map internal flow types to Klaviyo metric names
   */
  private getFlowEventName(flowType: string): string {
    const flowEventMap: Record<string, string> = {
      welcome: 'Welcome Flow Triggered',
      abandoned_cart: 'Abandoned Cart',
      abandoned_checkout: 'Abandoned Checkout',
      post_purchase_education: 'Post Purchase Education',
      win_back: 'Win Back Flow Triggered',
      browse_abandonment: 'Browse Abandonment',
    }

    return flowEventMap[flowType] || `Flow Triggered: ${flowType}`
  }

  /**
   * Track flow email interaction (opened, clicked)
   */
  async trackFlowInteraction(
    merchantId: string,
    customerEmail: string,
    flowType: string,
    interactionType: 'opened' | 'clicked',
    emailId?: string,
  ): Promise<void> {
    const apiKey = await this.merchantsService.getIntegrationToken(
      merchantId,
      IntegrationProvider.KLAVIYO,
    )

    try {
      const eventPayload = {
        data: {
          type: 'event',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: customerEmail,
                },
              },
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: `Flow ${interactionType === 'opened' ? 'Email Opened' : 'Email Clicked'}`,
                },
              },
            },
            properties: {
              flow_type: flowType,
              email_id: emailId,
              interaction_type: interactionType,
            },
            time: new Date().toISOString(),
          },
        },
      }

      const response = await fetch(`${this.klaviyoApiUrl}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          revision: '2024-02-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      })

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.statusText}`)
      }

      this.logger.log(
        `Tracked ${interactionType} for ${flowType} flow from ${customerEmail}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to track flow interaction: ${error.message}`,
        error.stack,
      )
    }
  }
}
