import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common'
import { MetricsService } from './metrics.service'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { subDays } from 'date-fns'

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get baseline for current merchant
   */
  @Get('baseline')
  async getBaseline(@Request() req: AuthenticatedRequest) {
    return await this.metricsService.getBaseline(req.user.merchantId)
  }

  /**
   * Trigger baseline recalculation
   */
  @Post('baseline/recalculate')
  async recalculateBaseline(@Request() req: AuthenticatedRequest) {
    const baseline = await this.metricsService.calculateBaseline(req.user.merchantId)
    return {
      success: true,
      baseline,
    }
  }

  /**
   * Compare actual revenue to baseline for a specific date
   */
  @Get('baseline/compare')
  async compareToBaseline(
    @Request() req: AuthenticatedRequest,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date()

    // Get today's actual revenue
    const orders = await this.metricsService.getOrdersForDate(
      req.user.merchantId,
      date,
    )
    const actualRevenue = orders.reduce((sum, order) => sum + Number(order.revenue), 0)

    const comparison = await this.metricsService.compareToBaseline(
      req.user.merchantId,
      date,
      actualRevenue,
    )

    return {
      date: date.toISOString(),
      actualRevenue,
      ...comparison,
    }
  }

  /**
   * Get post-purchase revenue metrics
   */
  @Get('post-purchase-revenue')
  async getPostPurchaseRevenue(
    @Request() req: AuthenticatedRequest,
    @Query('days') days: string = '30',
  ) {
    const daysNum = parseInt(days, 10)
    const endDate = new Date()
    const startDate = subDays(endDate, daysNum)

    return await this.metricsService.calculatePostPurchaseRevenue(
      req.user.merchantId,
      startDate,
      endDate,
    )
  }

  /**
   * Get revenue metrics from OLAP database
   * GET /metrics/revenue?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('revenue')
  async getRevenueMetrics(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const metrics = await this.metricsService.getRevenueMetricsFromOLAP(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
    )

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      ...metrics,
    }
  }

  /**
   * Get overview metrics for dashboard
   * GET /metrics/overview
   */
  @Get('overview')
  async getOverviewMetrics(@Request() req: AuthenticatedRequest) {
    const metrics = await this.metricsService.getOverviewMetrics(req.user.merchantId)
    return metrics
  }

  /**
   * Compare current revenue to baseline
   * GET /metrics/baseline-comparison?currentRevenue=10000&baselineRevenue=8000
   */
  @Get('baseline-comparison')
  async compareRevenueToBaseline(
    @Request() req: AuthenticatedRequest,
    @Query('currentRevenue') currentRevenue: string,
    @Query('baselineRevenue') baselineRevenue: string,
  ) {
    if (!currentRevenue || !baselineRevenue) {
      throw new BadRequestException('currentRevenue and baselineRevenue are required')
    }

    const comparison = await this.metricsService.compareRevenueToBaseline(
      req.user.merchantId,
      parseFloat(currentRevenue),
      parseFloat(baselineRevenue),
    )

    return {
      merchantId: req.user.merchantId,
      currentRevenue: parseFloat(currentRevenue),
      baselineRevenue: parseFloat(baselineRevenue),
      ...comparison,
    }
  }
}
