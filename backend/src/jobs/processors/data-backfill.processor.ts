import { Processor, Process } from '@nestjs/bull'
import { InjectQueue } from '@nestjs/bull'
import { Job, Queue } from 'bull'
import { Logger } from '@nestjs/common'
import { MerchantsService } from '../../merchants/merchants.service'
import { OrdersService } from '../../orders/orders.service'
import { CustomersService } from '../../customers/customers.service'
import { IntegrationProvider } from '../../merchants/entities/merchant-integration.entity'
import { subDays } from 'date-fns'

interface BackfillJobData {
  merchantId: string
  days: number
}

@Processor('data-backfill')
export class DataBackfillProcessor {
  private readonly logger = new Logger(DataBackfillProcessor.name)

  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    @InjectQueue('baseline-calculation')
    private readonly baselineQueue: Queue,
  ) {}

  @Process('backfill')
  async handleDataBackfill(job: Job<BackfillJobData>) {
    const { merchantId, days } = job.data

    this.logger.log(
      `Starting data backfill for merchant ${merchantId} (${days} days)`,
    )

    try {
      // Get merchant's Shopify access token
      const token = await this.merchantsService.getIntegrationToken(
        merchantId,
        IntegrationProvider.SHOPIFY,
      )

      if (!token) {
        throw new Error('No Shopify integration found for merchant')
      }

      const merchant = await this.merchantsService.findById(merchantId)
      const shopifyDomain = merchant.shopifyDomain

      await job.progress(5)

      // Calculate date range
      const endDate = new Date()
      const startDate = subDays(endDate, days)

      this.logger.log(
        `Fetching orders from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      )

      // Fetch orders from Shopify API
      let ordersProcessed = 0
      let customersProcessed = 0
      let page = 1
      let hasMore = true

      while (hasMore) {
        // Fetch page of orders from Shopify
        const orders = await this.fetchShopifyOrders(
          shopifyDomain,
          token,
          startDate,
          endDate,
          page,
        )

        if (orders.length === 0) {
          hasMore = false
          break
        }

        // Process each order
        for (const order of orders) {
          try {
            // Create/update customer first
            if (order.customer) {
              await this.customersService.findOrCreateFromShopifyData(
                merchantId,
                order.customer,
              )
              customersProcessed++
            }

            // Create order
            await this.ordersService.createFromWebhook(merchantId, order)
            ordersProcessed++

            // Update progress
            const progress = Math.min(
              95,
              5 + (ordersProcessed / (days * 10)) * 90,
            )
            await job.progress(progress)
          } catch (orderError) {
            this.logger.warn(
              `Failed to process order ${order.id}: ${orderError.message}`,
            )
            // Continue with next order
          }
        }

        page++

        // Respect Shopify rate limits (2 calls per second)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      await job.progress(100)

      this.logger.log(
        `Backfill completed for merchant ${merchantId}: ${ordersProcessed} orders, ${customersProcessed} customers`,
      )

      // Trigger baseline calculation now that we have historical data
      await this.baselineQueue.add(
        'calculate',
        { merchantId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      )

      this.logger.log(
        `Queued baseline calculation for merchant ${merchantId} after backfill`,
      )

      return {
        status: 'success',
        merchantId,
        ordersProcessed,
        customersProcessed,
        daysBackfilled: days,
      }
    } catch (error) {
      this.logger.error(
        `Failed to backfill data for merchant ${merchantId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Fetch orders from Shopify REST API
   */
  private async fetchShopifyOrders(
    shopDomain: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    page: number,
  ): Promise<any[]> {
    const url = `https://${shopDomain}/admin/api/2024-01/orders.json`

    const params = new URLSearchParams({
      status: 'any',
      created_at_min: startDate.toISOString(),
      created_at_max: endDate.toISOString(),
      limit: '250', // Max per page
      page: page.toString(),
    })

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Shopify API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    return data.orders || []
  }
}
