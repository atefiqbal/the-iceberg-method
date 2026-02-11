import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'
import { Logger } from '@nestjs/common'
import { MetricsService } from '../../metrics/metrics.service'

interface BaselineJobData {
  merchantId: string
}

@Processor('baseline-calculation')
export class BaselineCalculationProcessor {
  private readonly logger = new Logger(BaselineCalculationProcessor.name)

  constructor(private readonly metricsService: MetricsService) {}

  @Process('calculate')
  async handleBaselineCalculation(job: Job<BaselineJobData>) {
    const { merchantId } = job.data

    this.logger.log(`Starting baseline calculation for merchant ${merchantId}`)

    try {
      // Report progress
      await job.progress(10)

      // Calculate baseline using the full algorithm
      const baseline = await this.metricsService.calculateBaseline(merchantId)

      await job.progress(90)

      if (!baseline) {
        this.logger.warn(
          `No baseline calculated for merchant ${merchantId} - insufficient data`,
        )
        return {
          status: 'no_data',
          merchantId,
        }
      }

      await job.progress(100)

      this.logger.log(
        `Baseline calculation completed for merchant ${merchantId}: ${baseline.dataPointsUsed} data points, ${baseline.isProvisional ? 'provisional' : 'final'}`,
      )

      return {
        status: 'success',
        merchantId,
        baseline: {
          dataPointsUsed: baseline.dataPointsUsed,
          isProvisional: baseline.isProvisional,
          anomaliesExcluded: baseline.anomaliesExcluded,
          lookbackDays: baseline.lookbackDays,
        },
      }
    } catch (error) {
      this.logger.error(
        `Failed to calculate baseline for merchant ${merchantId}: ${error.message}`,
        error.stack,
      )
      throw error // Will trigger retry
    }
  }
}
