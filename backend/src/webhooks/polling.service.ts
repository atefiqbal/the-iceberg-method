import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Merchant, MerchantStatus } from '../merchants/entities/merchant.entity'
import { Order } from '../orders/entities/order.entity'
import { ShopifyService } from '../shopify/shopify.service'
import { OrdersService } from '../orders/orders.service'
import { CustomersService } from '../customers/customers.service'
import { JourneysService } from '../journeys/journeys.service'
import { subHours } from 'date-fns'

export interface ReconciliationResult {
  merchantId: string
  checkedOrders: number
  missedOrders: number
  createdOrders: string[]
  errors: string[]
}

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name)
  private readonly LOOKBACK_HOURS = 12 // Check last 12 hours for missed webhooks

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly shopifyService: ShopifyService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly journeysService: JourneysService,
  ) {}

  /**
   * Scheduled polling fallback - runs every 6 hours
   * Catches any webhooks that might have been missed
   */
  @Cron('0 */6 * * *') // Every 6 hours at :00
  async scheduledReconciliation() {
    this.logger.log('Starting scheduled webhook reconciliation')

    try {
      const merchants = await this.merchantRepository.find({
        where: { status: MerchantStatus.ACTIVE },
      })

      const results: ReconciliationResult[] = []

      for (const merchant of merchants) {
        try {
          const result = await this.reconcileMerchantOrders(merchant.id)
          results.push(result)

          if (result.missedOrders > 0) {
            this.logger.warn(
              `Reconciliation found ${result.missedOrders} missed orders for merchant ${merchant.id}`,
            )
          }
        } catch (error) {
          this.logger.error(
            `Reconciliation failed for merchant ${merchant.id}: ${error.message}`,
            error.stack,
          )
        }
      }

      const totalMissed = results.reduce((sum, r) => sum + r.missedOrders, 0)
      this.logger.log(
        `Reconciliation completed: ${results.length} merchants checked, ${totalMissed} missed orders recovered`,
      )
    } catch (error) {
      this.logger.error(
        `Scheduled reconciliation failed: ${error.message}`,
        error.stack,
      )
    }
  }

  /**
   * Reconcile orders for a specific merchant
   * Compares Shopify orders against database to find missing ones
   */
  async reconcileMerchantOrders(merchantId: string): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      merchantId,
      checkedOrders: 0,
      missedOrders: 0,
      createdOrders: [],
      errors: [],
    }

    try {
      // Calculate lookback window
      const now = new Date()
      const lookbackDate = subHours(now, this.LOOKBACK_HOURS)

      this.logger.log(
        `Reconciling orders for merchant ${merchantId} since ${lookbackDate.toISOString()}`,
      )

      // Fetch orders from Shopify
      const shopifyOrders = await this.fetchAllOrdersSince(merchantId, lookbackDate)
      result.checkedOrders = shopifyOrders.length

      this.logger.log(
        `Found ${shopifyOrders.length} orders in Shopify for merchant ${merchantId}`,
      )

      // Check each order against database
      for (const shopifyOrder of shopifyOrders) {
        try {
          const exists = await this.orderRepository.findOne({
            where: {
              merchantId,
              shopifyOrderId: shopifyOrder.id.toString(),
            },
          })

          if (!exists) {
            // Order missing - create it
            this.logger.warn(
              `Missed order detected: ${shopifyOrder.id} for merchant ${merchantId}`,
            )

            // Create or update customer first
            if (shopifyOrder.customer) {
              await this.customersService.createOrUpdateFromShopify(
                merchantId,
                shopifyOrder.customer,
              )
            }

            // Create order
            const order = await this.ordersService.createFromWebhook(
              merchantId,
              shopifyOrder,
            )

            // Update journey state
            if (order.customerId && shopifyOrder.customer) {
              const customer = await this.customersService.findOne(order.customerId)
              const orderData = {
                revenue: parseFloat(shopifyOrder.total_price || '0'),
                purchasedAt: new Date(shopifyOrder.created_at),
                productSku: shopifyOrder.line_items?.[0]?.sku,
              }

              if (customer.totalOrders === 1) {
                await this.journeysService.handleFirstPurchase(
                  merchantId,
                  order.customerId,
                  orderData,
                )
              } else {
                await this.journeysService.handleRepeatPurchase(
                  merchantId,
                  order.customerId,
                  orderData,
                )
              }
            }

            result.missedOrders++
            result.createdOrders.push(shopifyOrder.id.toString())
          }
        } catch (error) {
          this.logger.error(
            `Failed to reconcile order ${shopifyOrder.id}: ${error.message}`,
            error.stack,
          )
          result.errors.push(`Order ${shopifyOrder.id}: ${error.message}`)
        }
      }

      return result
    } catch (error) {
      this.logger.error(
        `Reconciliation failed for merchant ${merchantId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Fetch all orders from Shopify since a given date
   */
  private async fetchAllOrdersSince(
    merchantId: string,
    sinceDate: Date,
  ): Promise<any[]> {
    const allOrders: any[] = []
    let sinceId: string | null = null
    let hasMore = true

    while (hasMore) {
      const result = await this.shopifyService.getOrders(merchantId, {
        limit: 250,
        sinceId,
        createdAtMin: sinceDate.toISOString(),
        status: 'any',
      })

      allOrders.push(...result.orders)

      if (result.orders.length === 250) {
        // More pages available
        sinceId = result.orders[result.orders.length - 1].id
      } else {
        hasMore = false
      }
    }

    return allOrders
  }

  /**
   * Manually trigger reconciliation for a specific merchant
   */
  async triggerManualReconciliation(merchantId: string): Promise<ReconciliationResult> {
    this.logger.log(`Manual reconciliation triggered for merchant ${merchantId}`)
    return await this.reconcileMerchantOrders(merchantId)
  }
}
