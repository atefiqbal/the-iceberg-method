import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { MerchantsService } from '../merchants/merchants.service'
import { MerchantStatus } from '../merchants/entities/merchant.entity'
import { KlaviyoService } from '../klaviyo/klaviyo.service'
import { IntegrationProvider } from '../merchants/entities/merchant-integration.entity'

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)

  constructor(
    @InjectQueue('baseline-calculation')
    private baselineQueue: Queue,
    @InjectQueue('data-backfill')
    private backfillQueue: Queue,
    private merchantsService: MerchantsService,
    private klaviyoService: KlaviyoService,
  ) {}

  /**
   * Schedule baseline recalculation for all active merchants
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleDailyBaselineCalculation() {
    this.logger.log('Starting daily baseline calculation for all merchants')

    try {
      const merchants = await this.merchantsService.findAll({
        status: MerchantStatus.ACTIVE,
      })

      for (const merchant of merchants) {
        await this.baselineQueue.add(
          'calculate',
          { merchantId: merchant.id },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        )
      }

      this.logger.log(
        `Queued baseline calculation for ${merchants.length} merchants`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to schedule baseline calculation: ${error.message}`,
        error.stack,
      )
    }
  }

  /**
   * Hourly deliverability check for all active merchants
   * Runs every hour at :00
   */
  @Cron('0 * * * *')
  async scheduleHourlyDeliverabilityCheck() {
    this.logger.log('Starting hourly deliverability check for all merchants')

    try {
      const merchants = await this.merchantsService.findAll({
        status: MerchantStatus.ACTIVE,
      })

      let processedCount = 0
      let skippedCount = 0

      for (const merchant of merchants) {
        try {
          // Check if Klaviyo is connected
          const integrations = await this.merchantsService.getIntegrations(
            merchant.id,
          )
          const klaviyoConnected = integrations.some(
            (i) =>
              i.provider === IntegrationProvider.KLAVIYO && i.status === 'active',
          )

          if (!klaviyoConnected) {
            skippedCount++
            continue
          }

          // Sync deliverability metrics and evaluate gate
          await this.klaviyoService.syncDeliverabilityMetrics(merchant.id)
          processedCount++
        } catch (error) {
          this.logger.error(
            `Failed to check deliverability for merchant ${merchant.id}: ${error.message}`,
            error.stack,
          )
        }
      }

      this.logger.log(
        `Hourly deliverability check complete: ${processedCount} processed, ${skippedCount} skipped (no Klaviyo)`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to schedule hourly deliverability check: ${error.message}`,
        error.stack,
      )
    }
  }

  /**
   * Manually trigger baseline calculation for a merchant
   */
  async triggerBaselineCalculation(merchantId: string): Promise<void> {
    await this.baselineQueue.add('calculate', { merchantId })
    this.logger.log(`Manually triggered baseline calculation for ${merchantId}`)
  }

  /**
   * Trigger data backfill for a merchant (90 days of historical orders)
   */
  async triggerDataBackfill(
    merchantId: string,
    days: number = 90,
  ): Promise<void> {
    await this.backfillQueue.add(
      'backfill',
      { merchantId, days },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        timeout: 600000, // 10 minutes
      },
    )
    this.logger.log(
      `Triggered data backfill for ${merchantId} (${days} days)`,
    )
  }

  /**
   * Get baseline calculation job status
   */
  async getBaselineJobStatus(merchantId: string): Promise<any> {
    const jobs = await this.baselineQueue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ])

    const merchantJobs = jobs.filter(
      (job) => job.data.merchantId === merchantId,
    )

    return Promise.all(
      merchantJobs.map(async (job) => ({
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        createdAt: new Date(job.timestamp),
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason,
      })),
    )
  }

  /**
   * Get backfill job status
   */
  async getBackfillJobStatus(merchantId: string): Promise<any> {
    const jobs = await this.backfillQueue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ])

    const merchantJobs = jobs.filter(
      (job) => job.data.merchantId === merchantId,
    )

    return Promise.all(
      merchantJobs.map(async (job) => ({
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        createdAt: new Date(job.timestamp),
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason,
      })),
    )
  }
}
