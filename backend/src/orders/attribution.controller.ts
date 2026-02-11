import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common'
import { AttributionService } from './attribution.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AuthenticatedRequest } from '../common/types/express-request.interface'

@Controller('attribution')
@UseGuards(JwtAuthGuard)
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}

  /**
   * Get attribution breakdown
   * GET /attribution/breakdown?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('breakdown')
  async getAttributionBreakdown(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const breakdown = await this.attributionService.getAttributionBreakdown(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
    )

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      breakdown,
    }
  }

  /**
   * Get email flow attribution
   * GET /attribution/email-flows?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('email-flows')
  async getEmailFlowAttribution(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const flows = await this.attributionService.getEmailFlowAttribution(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
    )

    const totalRevenue = flows.reduce((sum, flow) => sum + flow.revenue, 0)

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      totalRevenue,
      flows: flows.map((flow) => ({
        flowName: flow.flowName,
        campaign: flow.campaign,
        revenue: flow.revenue,
        orderCount: flow.orderCount,
        percentage: totalRevenue > 0 ? (flow.revenue / totalRevenue) * 100 : 0,
      })),
    }
  }

  /**
   * Get email attributed revenue
   * GET /attribution/email-revenue?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('email-revenue')
  async getEmailAttributedRevenue(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const revenue = await this.attributionService.getEmailAttributedRevenue(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
    )

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      emailRevenue: revenue,
    }
  }

  /**
   * Get top performing flows
   * GET /attribution/top-flows?startDate=2024-01-01&endDate=2024-01-31&limit=10
   */
  @Get('top-flows')
  async getTopPerformingFlows(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const flows = await this.attributionService.getTopPerformingFlows(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
      limit ? parseInt(limit, 10) : 10,
    )

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      flows,
    }
  }

  /**
   * Get attribution lift
   * GET /attribution/lift?startDate=2024-01-01&endDate=2024-01-31&baselineRevenue=10000
   */
  @Get('lift')
  async getAttributionLift(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('baselineRevenue') baselineRevenue: string,
  ) {
    if (!startDate || !endDate || !baselineRevenue) {
      throw new BadRequestException('startDate, endDate, and baselineRevenue are required')
    }

    const lift = await this.attributionService.calculateAttributionLift(
      req.user.merchantId,
      new Date(startDate),
      new Date(endDate),
      parseFloat(baselineRevenue),
    )

    return {
      merchantId: req.user.merchantId,
      startDate,
      endDate,
      ...lift,
    }
  }

  /**
   * Get flow stats for specific flow
   * GET /attribution/flow/:flowType?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('flow/:flowType')
  async getFlowStats(
    @Request() req: AuthenticatedRequest,
    @Param('flowType') flowType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required')
    }

    const stats = await this.attributionService.getFlowStats(
      req.user.merchantId,
      flowType,
      new Date(startDate),
      new Date(endDate),
    )

    return {
      merchantId: req.user.merchantId,
      flowType,
      startDate,
      endDate,
      ...stats,
    }
  }
}
