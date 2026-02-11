import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KlaviyoService } from './klaviyo.service'
import { MerchantsService } from '../merchants/merchants.service'
import { MerchantStatus } from '../merchants/entities/merchant.entity'
import { IntegrationProvider } from '../merchants/entities/merchant-integration.entity'

@Injectable()
export class KlaviyoSyncService {
  private readonly logger = new Logger(KlaviyoSyncService.name)

  constructor(
    private readonly klaviyoService: KlaviyoService,
    private readonly merchantsService: MerchantsService,
  ) {}

  /**
   * Sync deliverability metrics for all merchants with Klaviyo
   * Runs hourly
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncDeliverabilityMetrics() {
    this.logger.log('Starting hourly deliverability sync for all merchants')

    try {
      // Get all active merchants
      const merchants = await this.merchantsService.findAll({
        status: MerchantStatus.ACTIVE,
      })

      let syncedCount = 0
      let skippedCount = 0

      for (const merchant of merchants) {
        try {
          // Check if merchant has Klaviyo connected
          const integrations = await this.merchantsService.getIntegrations(
            merchant.id,
          )
          const klaviyoIntegration = integrations.find(
            (i) =>
              i.provider === IntegrationProvider.KLAVIYO &&
              i.status === 'active',
          )

          if (!klaviyoIntegration) {
            skippedCount++
            continue
          }

          // Sync deliverability metrics
          await this.klaviyoService.syncDeliverabilityMetrics(merchant.id)
          syncedCount++

          // Rate limit: wait 500ms between merchants
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          this.logger.error(
            `Failed to sync deliverability for merchant ${merchant.id}: ${error.message}`,
          )
          // Continue with next merchant
        }
      }

      this.logger.log(
        `Deliverability sync completed: ${syncedCount} synced, ${skippedCount} skipped`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to run deliverability sync: ${error.message}`,
        error.stack,
      )
    }
  }
}
