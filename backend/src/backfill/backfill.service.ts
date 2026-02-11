import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BackfillJob, BackfillStatus, BackfillType } from './entities/backfill-job.entity'
import { ShopifyService } from '../shopify/shopify.service'
import { OrdersService } from '../orders/orders.service'
import { CustomersService } from '../customers/customers.service'
import { JourneysService } from '../journeys/journeys.service'

@Injectable()
export class BackfillService {
  private readonly logger = new Logger(BackfillService.name)
  private readonly BATCH_SIZE = 50 // Shopify allows up to 250, but we'll be conservative
  private readonly RATE_LIMIT_DELAY = 500 // ms between batches

  constructor(
    @InjectRepository(BackfillJob)
    private readonly backfillJobRepository: Repository<BackfillJob>,
    private readonly shopifyService: ShopifyService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly journeysService: JourneysService,
  ) {}

  /**
   * Start a historical backfill for a merchant
   * Pulls last 90 days of order data from Shopify
   */
  async startBackfill(merchantId: string, daysBack: number = 90): Promise<BackfillJob> {
    // Check if backfill already in progress
    const existingJob = await this.backfillJobRepository.findOne({
      where: {
        merchantId,
        status: BackfillStatus.IN_PROGRESS,
      },
    })

    if (existingJob) {
      throw new Error('Backfill already in progress for this merchant')
    }

    // Create backfill job
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const job = this.backfillJobRepository.create({
      merchantId,
      backfillType: BackfillType.ORDERS,
      status: BackfillStatus.PENDING,
      metadata: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        batchSize: this.BATCH_SIZE,
        retryCount: 0,
      },
    })

    const savedJob = await this.backfillJobRepository.save(job)

    // Start backfill process (non-blocking)
    this.processBackfill(savedJob.id).catch((error) => {
      this.logger.error(`Backfill failed for job ${savedJob.id}: ${error.message}`, error.stack)
    })

    return savedJob
  }

  /**
   * Process backfill job - pulls orders from Shopify in batches
   */
  private async processBackfill(jobId: string): Promise<void> {
    const job = await this.backfillJobRepository.findOne({ where: { id: jobId } })
    if (!job) {
      throw new Error(`Backfill job ${jobId} not found`)
    }

    try {
      job.status = BackfillStatus.IN_PROGRESS
      job.startedAt = new Date()
      await this.backfillJobRepository.save(job)

      this.logger.log(`Starting backfill for merchant ${job.merchantId}, job ${job.id}`)

      const startDate = new Date(job.metadata.startDate)
      const endDate = new Date(job.metadata.endDate)

      let hasMorePages = true
      let sinceId: string | null = job.metadata.lastProcessedId || null
      let totalProcessed = job.processedRecords || 0
      let totalFailed = job.failedRecords || 0

      while (hasMorePages) {
        try {
          // Fetch batch from Shopify
          const result = await this.shopifyService.getOrders(job.merchantId, {
            limit: this.BATCH_SIZE,
            sinceId,
            createdAtMin: startDate.toISOString(),
            createdAtMax: endDate.toISOString(),
            status: 'any', // Include all order statuses
          })

          const orders = result.orders || []
          hasMorePages = orders.length === this.BATCH_SIZE

          this.logger.log(
            `Fetched ${orders.length} orders for merchant ${job.merchantId} (batch)`,
          )

          // Process each order
          for (const shopifyOrder of orders) {
            try {
              // Create or update customer first
              if (shopifyOrder.customer) {
                await this.customersService.createOrUpdateFromShopify(
                  job.merchantId,
                  shopifyOrder.customer,
                )
              }

              // Create order
              const order = await this.ordersService.createFromWebhook(job.merchantId, shopifyOrder)

              // Update journey state if customer exists
              if (order.customerId && shopifyOrder.customer) {
                const customer = await this.customersService.findOne(order.customerId)
                const orderData = {
                  revenue: parseFloat(shopifyOrder.total_price || '0'),
                  purchasedAt: new Date(shopifyOrder.created_at),
                  productSku: shopifyOrder.line_items?.[0]?.sku,
                }

                // Determine if first or repeat purchase based on historical data
                if (customer.totalOrders === 1) {
                  await this.journeysService.handleFirstPurchase(
                    job.merchantId,
                    order.customerId,
                    orderData,
                  )
                } else {
                  await this.journeysService.handleRepeatPurchase(
                    job.merchantId,
                    order.customerId,
                    orderData,
                  )
                }
              }

              totalProcessed++
              sinceId = shopifyOrder.id
            } catch (error) {
              this.logger.error(
                `Failed to process order ${shopifyOrder.id}: ${error.message}`,
                error.stack,
              )
              totalFailed++
            }
          }

          // Update job progress
          job.processedRecords = totalProcessed
          job.failedRecords = totalFailed
          job.totalRecords = totalProcessed + (hasMorePages ? this.BATCH_SIZE : 0) // Estimate
          job.metadata.lastProcessedId = sinceId
          await this.backfillJobRepository.save(job)

          // Rate limiting
          if (hasMorePages) {
            await this.sleep(this.RATE_LIMIT_DELAY)
          }
        } catch (error) {
          this.logger.error(`Batch processing failed: ${error.message}`, error.stack)

          // Retry logic
          if (job.metadata.retryCount < 3) {
            job.metadata.retryCount++
            await this.backfillJobRepository.save(job)
            await this.sleep(2000) // Wait before retry
            continue
          } else {
            throw error // Give up after 3 retries
          }
        }
      }

      // Mark as completed
      job.status = BackfillStatus.COMPLETED
      job.completedAt = new Date()
      job.totalRecords = totalProcessed
      await this.backfillJobRepository.save(job)

      this.logger.log(
        `Backfill completed for merchant ${job.merchantId}. Processed: ${totalProcessed}, Failed: ${totalFailed}`,
      )
    } catch (error) {
      job.status = BackfillStatus.FAILED
      job.errorMessage = error.message
      job.completedAt = new Date()
      await this.backfillJobRepository.save(job)
      throw error
    }
  }

  /**
   * Get backfill status for a merchant
   */
  async getBackfillStatus(merchantId: string): Promise<BackfillJob | null> {
    return await this.backfillJobRepository.findOne({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get all backfill jobs for a merchant
   */
  async getBackfillHistory(merchantId: string): Promise<BackfillJob[]> {
    return await this.backfillJobRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Cancel a running backfill job
   */
  async cancelBackfill(jobId: string): Promise<void> {
    const job = await this.backfillJobRepository.findOne({ where: { id: jobId } })
    if (!job) {
      throw new Error(`Backfill job ${jobId} not found`)
    }

    if (job.status !== BackfillStatus.IN_PROGRESS) {
      throw new Error(`Cannot cancel job with status ${job.status}`)
    }

    job.status = BackfillStatus.CANCELLED
    job.completedAt = new Date()
    await this.backfillJobRepository.save(job)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
