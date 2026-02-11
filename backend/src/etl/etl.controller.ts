import {
  Controller,
  Post,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { ETLService } from './etl.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('etl')
@UseGuards(JwtAuthGuard)
export class ETLController {
  private readonly logger = new Logger(ETLController.name)
  constructor(private readonly etlService: ETLService) {}
  /**
   * Manually trigger ETL for a specific merchant
   * POST /etl/trigger/:merchantId
   *
   * Useful for:
   * - Testing ETL pipeline
   * - Recovery after data issues
   * - Backfilling after integration setup
   */
  @Post('trigger/:merchantId')
  async triggerManualETL(@Param('merchantId') merchantId: string) {
    if (!merchantId) {
      throw new BadRequestException('merchantId is required')
    }
    this.logger.log(`Manual ETL trigger requested for merchant ${merchantId}`)
    try {
      await this.etlService.triggerManualETL(merchantId)
      return {
        success: true,
        message: `ETL completed successfully for merchant ${merchantId}`,
      }
    } catch (error) {
      this.logger.error(
        `Manual ETL failed for merchant ${merchantId}: ${error.message}`,
        error.stack,
      )
      return {
        success: false,
        message: `ETL failed: ${error.message}`,
      }
    }
  }

  /**
   * Refresh materialized views
   * POST /etl/refresh-views
   * Should be called after ETL runs or when dashboard data needs refresh
   */
  @Post('refresh-views')
  async refreshMaterializedViews() {
    this.logger.log('Manual materialized view refresh requested')
    try {
      await this.etlService.refreshMaterializedViews()
      return {
        success: true,
        message: 'Materialized views refreshed successfully',
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh materialized views: ${error.message}`,
        error.stack,
      )
      return {
        success: false,
        message: `Refresh failed: ${error.message}`,
      }
    }
  }
}
