import { Processor, Process, OnQueueFailed } from '@nestjs/bull'
import { Job } from 'bull'
import { Logger } from '@nestjs/common'
import { ShopifyWebhookEvent, WebhooksService } from '../webhooks.service'
import { DLQService } from '../dlq.service'
import { OrdersService } from '../../orders/orders.service'
import { CustomersService } from '../../customers/customers.service'
import { MerchantsService } from '../../merchants/merchants.service'
import { JourneysService } from '../../journeys/journeys.service'

@Processor('webhooks')
export class ShopifyWebhookProcessor {
  private readonly logger = new Logger(ShopifyWebhookProcessor.name)

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly dlqService: DLQService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly merchantsService: MerchantsService,
    private readonly journeysService: JourneysService,
  ) {}

  /**
   * Process Shopify webhook events
   */
  @Process('shopify-webhook')
  async handleShopifyWebhook(job: Job<ShopifyWebhookEvent>) {
    const { topic, shopDomain, webhookId, payload } = job.data

    this.logger.log(`Processing webhook: ${topic} (${webhookId}) from ${shopDomain}`)

    try {
      // Check idempotency - skip if already processed
      const isProcessed = await this.webhooksService.isWebhookProcessed(webhookId)
      if (isProcessed) {
        this.logger.warn(`Webhook ${webhookId} already processed, skipping`)
        return { status: 'duplicate', webhookId }
      }

      // Find merchant
      const merchant = await this.merchantsService.findByShopifyDomain(shopDomain)

      // Route to appropriate handler based on topic
      switch (topic) {
        case 'orders/create':
          await this.handleOrderCreate(merchant.id, payload)
          break

        case 'orders/updated':
          await this.handleOrderUpdate(merchant.id, payload)
          break

        case 'customers/create':
          await this.handleCustomerCreate(merchant.id, payload)
          break

        case 'customers/update':
          await this.handleCustomerUpdate(merchant.id, payload)
          break

        case 'checkouts/create':
          await this.handleCheckoutCreate(merchant.id, payload)
          break

        case 'checkouts/update':
          await this.handleCheckoutUpdate(merchant.id, payload)
          break

        case 'app/uninstalled':
          await this.handleAppUninstalled(merchant.id)
          break

        default:
          this.logger.warn(`Unhandled webhook topic: ${topic}`)
      }

      // Mark as processed
      await this.webhooksService.markWebhookProcessed(merchant.id, webhookId, topic)

      this.logger.log(`Successfully processed webhook ${webhookId}`)
      return { status: 'success', webhookId, topic }
    } catch (error) {
      this.logger.error(
        `Failed to process webhook ${webhookId}: ${error.message}`,
        error.stack,
      )
      throw error // Will trigger retry
    }
  }

  /**
   * Handle orders/create webhook
   */
  private async handleOrderCreate(merchantId: string, order: any) {
    this.logger.debug(`Processing order create: ${order.id} for merchant ${merchantId}`)

    const createdOrder = await this.ordersService.createFromWebhook(merchantId, order)

    // Track customer journey state if customer exists
    if (createdOrder.customerId && order.customer) {
      const customer = await this.customersService.findOne(createdOrder.customerId)

      const orderData = {
        revenue: parseFloat(order.total_price || 0),
        purchasedAt: new Date(order.created_at),
        productSku: order.line_items?.[0]?.sku,
      }

      // Determine if this is first or repeat purchase
      if (customer.totalOrders === 1) {
        // First purchase - transition to post-purchase
        await this.journeysService.handleFirstPurchase(
          merchantId,
          createdOrder.customerId,
          orderData,
        )
      } else {
        // Repeat purchase - advance product step
        await this.journeysService.handleRepeatPurchase(
          merchantId,
          createdOrder.customerId,
          orderData,
        )
      }
    }

    // TODO: Trigger attribution logic
    // TODO: Update daily metrics
  }

  /**
   * Handle orders/updated webhook
   */
  private async handleOrderUpdate(merchantId: string, order: any) {
    this.logger.debug(`Processing order update: ${order.id}`)

    await this.ordersService.updateFromWebhook(merchantId, order)
  }

  /**
   * Handle customers/create webhook
   */
  private async handleCustomerCreate(merchantId: string, customer: any) {
    this.logger.debug(`Processing customer create: ${customer.id}`)

    await this.customersService.createFromWebhook(merchantId, customer)
  }

  /**
   * Handle customers/update webhook
   */
  private async handleCustomerUpdate(merchantId: string, customer: any) {
    this.logger.debug(`Processing customer update: ${customer.id}`)

    await this.customersService.updateFromWebhook(merchantId, customer)
  }

  /**
   * Handle checkouts/create webhook
   */
  private async handleCheckoutCreate(merchantId: string, checkout: any) {
    this.logger.debug(`Processing checkout create: ${checkout.id}`)

    // Track checkout initiation for funnel metrics
    // If customer exists, we may trigger abandoned checkout flow later
    if (checkout.customer?.id) {
      const customer = await this.customersService.findByShopifyId(
        merchantId,
        checkout.customer.id.toString(),
      )

      if (customer) {
        // Store checkout data for potential abandonment tracking
        // Will be triggered by a scheduled job that checks for abandoned checkouts
        this.logger.debug(
          `Checkout initiated for customer ${customer.id}, will monitor for abandonment`,
        )
      }
    }
  }

  /**
   * Handle checkouts/update webhook
   */
  private async handleCheckoutUpdate(merchantId: string, checkout: any) {
    this.logger.debug(`Processing checkout update: ${checkout.id}`)

    // TODO: Update checkout state
  }

  /**
   * Handle app/uninstalled webhook
   */
  private async handleAppUninstalled(merchantId: string) {
    this.logger.warn(`App uninstalled for merchant ${merchantId}`)

    // TODO: Mark merchant as disconnected
    // TODO: Disable integrations
    // TODO: Send notification
  }

  /**
   * Handle failed jobs after all retries exhausted
   * Add to DLQ for manual review and retry
   */
  @OnQueueFailed()
  async handleFailedJob(job: Job<ShopifyWebhookEvent>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    )

    const { topic, shopDomain, webhookId, payload } = job.data

    try {
      // Find merchant to get merchant ID
      const merchant = await this.merchantsService.findByShopifyDomain(shopDomain)

      // Add to DLQ
      await this.dlqService.addToDLQ(
        merchant.id,
        webhookId,
        topic,
        shopDomain,
        payload,
        error,
      )

      this.logger.log(`Added failed webhook ${webhookId} to DLQ`)
    } catch (dlqError) {
      this.logger.error(
        `Failed to add webhook ${webhookId} to DLQ: ${dlqError.message}`,
        dlqError.stack,
      )
    }
  }
}
