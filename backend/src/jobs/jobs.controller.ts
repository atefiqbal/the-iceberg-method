import { Controller, Post, Get, UseGuards, Request, Query } from '@nestjs/common'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JobsService } from './jobs.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  /**
   * Manually trigger baseline recalculation
   */
  @Post('baseline/calculate')
  async triggerBaselineCalculation(@Request() req: AuthenticatedRequest) {
    await this.jobsService.triggerBaselineCalculation(req.user.merchantId)
    return {
      success: true,
      message: 'Baseline calculation job queued',
    }
  }

  /**
   * Get baseline calculation job status
   */
  @Get('baseline/status')
  async getBaselineJobStatus(@Request() req: AuthenticatedRequest) {
    const jobs = await this.jobsService.getBaselineJobStatus(req.user.merchantId)
    return {
      jobs,
      total: jobs.length,
    }
  }

  /**
   * Trigger data backfill (90 days of historical orders)
   */
  @Post('backfill')
  async triggerDataBackfill(
    @Request() req: AuthenticatedRequest,
    @Query('days') days: string = '90',
  ) {
    const daysNum = parseInt(days, 10)
    await this.jobsService.triggerDataBackfill(req.user.merchantId, daysNum)
    return {
      success: true,
      message: `Data backfill job queued (${daysNum} days)`,
    }
  }

  /**
   * Get backfill job status
   */
  @Get('backfill/status')
  async getBackfillJobStatus(@Request() req: AuthenticatedRequest) {
    const jobs = await this.jobsService.getBackfillJobStatus(req.user.merchantId)
    return {
      jobs,
      total: jobs.length,
    }
  }
}
