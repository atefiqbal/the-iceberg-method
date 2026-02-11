import { Controller, Get, Post, Param, Query, UseGuards, Request, Delete } from '@nestjs/common'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { BackfillService } from './backfill.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('backfill')
@UseGuards(JwtAuthGuard)
export class BackfillController {
  constructor(private readonly backfillService: BackfillService) {}
  /**
   * Start a historical data backfill
   */
  @Post('start')
  async startBackfill(
    @Request() req: AuthenticatedRequest,
    @Query('daysBack') daysBack?: string,
  ) {
    const days = daysBack ? parseInt(daysBack, 10) : 90
    return await this.backfillService.startBackfill(req.user.merchantId, days)
  }
  /**
   * Get current backfill status
   */
  @Get('status')
  async getStatus(@Request() req: AuthenticatedRequest) {
    return await this.backfillService.getBackfillStatus(req.user.merchantId)
  }
  /**
   * Get backfill history
   */
  @Get('history')
  async getHistory(@Request() req: AuthenticatedRequest) {
    return await this.backfillService.getBackfillHistory(req.user.merchantId)
  }
  /**
   * Cancel a running backfill job
   */
  @Delete(':jobId')
  async cancelBackfill(@Param('jobId') jobId: string) {
    await this.backfillService.cancelBackfill(jobId)
    return { success: true }
  }
}
