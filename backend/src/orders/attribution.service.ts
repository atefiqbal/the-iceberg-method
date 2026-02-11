import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm'
import { Repository, DataSource, Between } from 'typeorm'
import { Order } from './entities/order.entity'

export interface AttributionBreakdown {
  source: string
  flowType?: string
  utmCampaign?: string
  revenue: number
  orderCount: number
  percentage: number
}

export interface EmailFlowAttribution {
  flowName: string
  campaign: string
  revenue: number
  orderCount: number
  orders: Order[]
}

@Injectable()
export class AttributionService {
  private readonly logger = new Logger(AttributionService.name)

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Get attribution breakdown for a merchant in date range
   * Groups orders by attribution source and calculates revenue percentages
   */
  async getAttributionBreakdown(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttributionBreakdown[]> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.attributionSource', 'source')
      .addSelect('order.attributionFlowType', 'flowType')
      .addSelect('order.utmCampaign', 'utmCampaign')
      .addSelect('SUM(order.revenue)', 'revenue')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('order.attributionSource')
      .addGroupBy('order.attributionFlowType')
      .addGroupBy('order.utmCampaign')
      .orderBy('revenue', 'DESC')
      .getRawMany()

    // Calculate total revenue for percentages
    const totalRevenue = result.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0)

    return result.map((row) => ({
      source: row.source || 'unknown',
      flowType: row.flowType,
      utmCampaign: row.utmCampaign,
      revenue: parseFloat(row.revenue || 0),
      orderCount: parseInt(row.orderCount, 10),
      percentage: totalRevenue > 0 ? (parseFloat(row.revenue || 0) / totalRevenue) * 100 : 0,
    }))
  }

  /**
   * Get email flow attribution (only Iceberg Method flows)
   * Shows which email flows are driving revenue
   */
  async getEmailFlowAttribution(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EmailFlowAttribution[]> {
    const orders = await this.ordersRepository.find({
      where: {
        merchantId,
        attributionSource: 'iceberg_email',
        createdAt: Between(startDate, endDate),
      },
      order: {
        createdAt: 'DESC',
      },
    })

    // Group by flow type
    const flowMap = new Map<string, EmailFlowAttribution>()

    for (const order of orders) {
      const flowKey = order.attributionFlowType || 'unknown'
      const campaign = order.utmCampaign || 'unknown'

      if (!flowMap.has(flowKey)) {
        flowMap.set(flowKey, {
          flowName: flowKey,
          campaign,
          revenue: 0,
          orderCount: 0,
          orders: [],
        })
      }

      const flow = flowMap.get(flowKey)!
      flow.revenue += parseFloat(order.revenue.toString())
      flow.orderCount += 1
      flow.orders.push(order)
    }

    return Array.from(flowMap.values()).sort((a, b) => b.revenue - a.revenue)
  }

  /**
   * Get total email-attributed revenue
   */
  async getEmailAttributedRevenue(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.revenue)', 'total')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.attributionSource = :source', { source: 'iceberg_email' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne()

    return parseFloat(result.total || 0)
  }

  /**
   * Get attribution stats for specific flow
   */
  async getFlowStats(
    merchantId: string,
    flowType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    revenue: number
    orderCount: number
    avgOrderValue: number
  }> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.revenue)', 'revenue')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('AVG(order.revenue)', 'avgOrderValue')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.attributionSource = :source', { source: 'iceberg_email' })
      .andWhere('order.attributionFlowType = :flowType', { flowType })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne()

    return {
      revenue: parseFloat(result.revenue || 0),
      orderCount: parseInt(result.orderCount, 10),
      avgOrderValue: parseFloat(result.avgOrderValue || 0),
    }
  }

  /**
   * Get top performing flows for merchant
   */
  async getTopPerformingFlows(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<
    Array<{
      flowType: string
      campaign: string
      revenue: number
      orderCount: number
      avgOrderValue: number
    }>
  > {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.attributionFlowType', 'flowType')
      .addSelect('order.utmCampaign', 'campaign')
      .addSelect('SUM(order.revenue)', 'revenue')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('AVG(order.revenue)', 'avgOrderValue')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.attributionSource = :source', { source: 'iceberg_email' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('order.attributionFlowType')
      .addGroupBy('order.utmCampaign')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany()

    return result.map((row) => ({
      flowType: row.flowType || 'unknown',
      campaign: row.campaign || 'unknown',
      revenue: parseFloat(row.revenue || 0),
      orderCount: parseInt(row.orderCount, 10),
      avgOrderValue: parseFloat(row.avgOrderValue || 0),
    }))
  }

  /**
   * Calculate attribution lift
   * Compares email-attributed revenue vs baseline revenue
   */
  async calculateAttributionLift(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    baselineRevenue: number,
  ): Promise<{
    emailRevenue: number
    totalRevenue: number
    liftPercentage: number
    liftAmount: number
  }> {
    const emailRevenue = await this.getEmailAttributedRevenue(merchantId, startDate, endDate)

    // Get total revenue
    const totalResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.revenue)', 'total')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne()

    const totalRevenue = parseFloat(totalResult.total || 0)
    const liftAmount = totalRevenue - baselineRevenue
    const liftPercentage = baselineRevenue > 0 ? (liftAmount / baselineRevenue) * 100 : 0

    return {
      emailRevenue,
      totalRevenue,
      liftAmount,
      liftPercentage,
    }
  }
}
