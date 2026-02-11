import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WebhookEvent } from './entities/webhook-event.entity'

// Interface for webhook event data
export interface ShopifyWebhookEvent {
  topic: string
  shopDomain: string
  webhookId: string
  payload: any
  receivedAt: Date
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  constructor(
    @InjectQueue('webhooks') private webhooksQueue: Queue,
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
  ) {}

  /**
   * Queue Shopify webhook for async processing
   * Must be FAST - just push to Redis and return
   */
  async queueShopifyWebhook(event: ShopifyWebhookEvent): Promise<void> {
    try {
      await this.webhooksQueue.add('shopify-webhook', event, {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s delay
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 1000, // Keep last 1000 failed jobs for debugging
      })

      this.logger.debug(
        `Queued ${event.topic} webhook ${event.webhookId} for ${event.shopDomain}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to queue webhook ${event.webhookId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Check if webhook was already processed (idempotency)
   */
  async isWebhookProcessed(webhookId: string): Promise<boolean> {
    const existing = await this.webhookEventRepository.findOne({
      where: { eventId: webhookId },
    })
    return !!existing
  }

  /**
   * Mark webhook as processed
   */
  async markWebhookProcessed(
    merchantId: string,
    webhookId: string,
    topic: string,
  ): Promise<void> {
    await this.webhookEventRepository.save({
      merchantId,
      eventId: webhookId,
      topic,
    })
    this.logger.debug(`Marked webhook ${webhookId} as processed`)
  }

  /**
   * Handle order webhook (stub - to be implemented)
   */
  async handleOrderWebhook(shopDomain: string, orderData: any): Promise<void> {
    this.logger.log(`Order webhook received from ${shopDomain}`)
    // TODO: Implement order webhook handling
    return Promise.resolve()
  }

  /**
   * Handle customer webhook (stub - to be implemented)
   */
  async handleCustomerWebhook(shopDomain: string, customerData: any, action: string): Promise<void> {
    this.logger.log(`Customer ${action} webhook received from ${shopDomain}`)
    // TODO: Implement customer webhook handling
    return Promise.resolve()
  }

  /**
   * Get webhook processing stats (stub - to be implemented)
   */
  async getProcessingStats(merchantId: string, startDate?: Date, endDate?: Date): Promise<any> {
    this.logger.log(`Getting processing stats for merchant ${merchantId}`)
    // TODO: Implement stats collection
    return {
      totalProcessed: 0,
      successRate: 100,
      averageProcessingTime: 0,
    }
  }
}
