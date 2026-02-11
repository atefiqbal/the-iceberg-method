import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm'
import { Repository, Between, DataSource } from 'typeorm'
import { Baseline } from './entities/baseline.entity'
import { Order } from '../orders/entities/order.entity'
import { subDays, startOfDay, endOfDay, getDay } from 'date-fns'

interface DailyRevenue {
  date: Date
  revenue: number
  dayOfWeek: number
}

export interface DailyMetric {
  date: string
  revenue: number
  orders: number
  sessions: number
  checkoutRate: number
  conversionRate: number
  aov: number
}

export interface RevenueMetrics {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  dailyMetrics: DailyMetric[]
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name)

  constructor(
    @InjectRepository(Baseline)
    private baselineRepository: Repository<Baseline>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectDataSource('analytics') private readonly olapDb: DataSource,
  ) {}

  /**
   * Calculate revenue baseline for merchant
   * Implements the spec: 14-30 day lookback, exclude statistical outliers, day-of-week comparison
   */
  async calculateBaseline(
    merchantId: string,
    lookbackDays: number = 30,
    excludeAnomalies: boolean = true,
  ): Promise<Baseline> {
    this.logger.log(`Calculating baseline for merchant ${merchantId}`)

    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, lookbackDays))

    // Fetch all orders in lookback period
    const orders = await this.ordersRepository.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate) as any,
      },
      order: {
        createdAt: 'ASC',
      },
    })

    if (orders.length === 0) {
      this.logger.warn(`No orders found for merchant ${merchantId} in lookback period`)
      return this.createEmptyBaseline(merchantId, lookbackDays)
    }

    // Group orders by day
    const dailyRevenue = this.groupOrdersByDay(orders)

    // Exclude outliers if requested
    let filteredData = dailyRevenue
    let anomaliesExcluded = 0

    if (excludeAnomalies && dailyRevenue.length > 5) {
      const result = this.excludeOutliers(dailyRevenue)
      filteredData = result.filtered
      anomaliesExcluded = result.excluded.length

      if (anomaliesExcluded > 0) {
        this.logger.log(
          `Excluded ${anomaliesExcluded} anomaly days from baseline calculation`,
        )
      }
    }

    // Calculate average revenue per day-of-week
    const baselineByDow = this.calculateDayOfWeekAverages(filteredData)

    // Determine if provisional (need 30 days of actual data)
    const isProvisional = filteredData.length < 30

    // Save or update baseline
    let baseline = await this.baselineRepository.findOne({
      where: { merchantId },
    })

    if (baseline) {
      baseline.baselineByDow = baselineByDow
      baseline.calculatedAt = new Date()
      baseline.lookbackDays = lookbackDays
      baseline.dataPointsUsed = filteredData.length
      baseline.isProvisional = isProvisional
      baseline.anomaliesExcluded = anomaliesExcluded
    } else {
      baseline = this.baselineRepository.create({
        merchantId,
        baselineByDow,
        calculatedAt: new Date(),
        lookbackDays,
        dataPointsUsed: filteredData.length,
        isProvisional,
        anomaliesExcluded,
      })
    }

    await this.baselineRepository.save(baseline)

    this.logger.log(
      `Baseline calculated for merchant ${merchantId}: ${filteredData.length} data points, ${isProvisional ? 'PROVISIONAL' : 'COMPLETE'}`,
    )

    return baseline
  }

  /**
   * Group orders by day and sum revenue
   */
  private groupOrdersByDay(orders: Order[]): DailyRevenue[] {
    const dayMap = new Map<string, DailyRevenue>()

    for (const order of orders) {
      const dateKey = startOfDay(order.createdAt).toISOString()
      const dayOfWeek = getDay(order.createdAt)

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: startOfDay(order.createdAt),
          revenue: 0,
          dayOfWeek,
        })
      }

      const day = dayMap.get(dateKey)!
      day.revenue += Number(order.revenue)
    }

    return Array.from(dayMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )
  }

  /**
   * Exclude statistical outliers (>2 standard deviations)
   */
  private excludeOutliers(data: DailyRevenue[]): {
    filtered: DailyRevenue[]
    excluded: DailyRevenue[]
  } {
    const revenues = data.map((d) => d.revenue)

    // Calculate mean and standard deviation
    const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length
    const variance =
      revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      revenues.length
    const stdDev = Math.sqrt(variance)

    const lowerBound = mean - 2 * stdDev
    const upperBound = mean + 2 * stdDev

    const filtered = data.filter(
      (d) => d.revenue >= lowerBound && d.revenue <= upperBound,
    )
    const excluded = data.filter(
      (d) => d.revenue < lowerBound || d.revenue > upperBound,
    )

    return { filtered, excluded }
  }

  /**
   * Calculate average revenue per day of week
   */
  private calculateDayOfWeekAverages(
    data: DailyRevenue[],
  ): Record<string, number> {
    const dowGroups: Record<number, number[]> = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
    }

    // Group by day of week
    for (const day of data) {
      dowGroups[day.dayOfWeek].push(day.revenue)
    }

    // Calculate averages
    const baselineByDow: Record<string, number> = {}

    for (let dow = 0; dow < 7; dow++) {
      const revenues = dowGroups[dow]
      if (revenues.length > 0) {
        const average = revenues.reduce((sum, val) => sum + val, 0) / revenues.length
        baselineByDow[dow.toString()] = Math.round(average * 100) / 100 // Round to 2 decimals
      } else {
        baselineByDow[dow.toString()] = 0
      }
    }

    return baselineByDow
  }

  /**
   * Create empty baseline when no data available
   */
  private createEmptyBaseline(
    merchantId: string,
    lookbackDays: number,
  ): Baseline {
    return this.baselineRepository.create({
      merchantId,
      baselineByDow: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
      },
      calculatedAt: new Date(),
      lookbackDays,
      dataPointsUsed: 0,
      isProvisional: true,
      anomaliesExcluded: 0,
    })
  }

  /**
   * Get baseline for merchant
   */
  async getBaseline(merchantId: string): Promise<Baseline | null> {
    return await this.baselineRepository.findOne({
      where: { merchantId },
    })
  }

  /**
   * Get orders for a specific date
   */
  async getOrdersForDate(merchantId: string, date: Date): Promise<Order[]> {
    const start = startOfDay(date)
    const end = endOfDay(date)

    return await this.ordersRepository.find({
      where: {
        merchantId,
        createdAt: Between(start, end) as any,
      },
    })
  }

  /**
   * Compare actual revenue to baseline
   */
  async compareToBaseline(
    merchantId: string,
    date: Date,
    actualRevenue: number,
  ): Promise<{
    expectedRevenue: number
    lift: number
    isProvisional: boolean
  }> {
    const baseline = await this.getBaseline(merchantId)

    if (!baseline) {
      throw new Error(`No baseline found for merchant ${merchantId}`)
    }

    const dayOfWeek = getDay(date)
    const expectedRevenue = baseline.baselineByDow[dayOfWeek.toString()] || 0

    const lift = expectedRevenue > 0 ? (actualRevenue - expectedRevenue) / expectedRevenue : 0

    return {
      expectedRevenue,
      lift: lift * 100, // Return as percentage
      isProvisional: baseline.isProvisional,
    }
  }

  /**
   * Calculate post-purchase revenue percentage
   */
  async calculatePostPurchaseRevenue(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRevenue: number
    postPurchaseRevenue: number
    postPurchasePercentage: number
  }> {
    // Get all orders in date range
    const orders = await this.ordersRepository.find({
      where: {
        merchantId,
        createdAt: Between(startDate, endDate) as any,
      },
    })

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.revenue), 0)

    // Orders attributed to email flows are post-purchase revenue
    const postPurchaseOrders = orders.filter(
      (order) => order.attributionSource === 'iceberg_email',
    )

    const postPurchaseRevenue = postPurchaseOrders.reduce(
      (sum, order) => sum + Number(order.revenue),
      0,
    )

    const postPurchasePercentage =
      totalRevenue > 0 ? (postPurchaseRevenue / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      postPurchaseRevenue,
      postPurchasePercentage,
    }
  }

  /**
   * Get revenue metrics from OLAP database
   */
  async getRevenueMetricsFromOLAP(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueMetrics> {
    const query = `
      SELECT
        date,
        total_revenue as revenue,
        total_orders as orders,
        total_sessions as sessions,
        checkout_rate as "checkoutRate",
        conversion_rate as "conversionRate",
        aov
      FROM daily_metrics
      WHERE merchant_id = $1
        AND date BETWEEN $2 AND $3
      ORDER BY date ASC
    `

    const dailyMetrics = await this.olapDb.query(query, [
      merchantId,
      startDate,
      endDate,
    ])

    // Calculate totals
    const totalRevenue = dailyMetrics.reduce(
      (sum: number, row: any) => sum + parseFloat(row.revenue || 0),
      0,
    )
    const totalOrders = dailyMetrics.reduce(
      (sum: number, row: any) => sum + parseInt(row.orders || 0, 10),
      0,
    )
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      dailyMetrics: dailyMetrics.map((row: any) => ({
        date: row.date,
        revenue: parseFloat(row.revenue || 0),
        orders: parseInt(row.orders || 0, 10),
        sessions: parseInt(row.sessions || 0, 10),
        checkoutRate: parseFloat(row.checkoutRate || 0),
        conversionRate: parseFloat(row.conversionRate || 0),
        aov: parseFloat(row.aov || 0),
      })),
    }
  }

  /**
   * Get attribution metrics from OLAP database
   */
  async getAttributionMetricsFromOLAP(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const query = `
      SELECT
        flow_name as "flowName",
        utm_campaign as "utmCampaign",
        SUM(orders) as orders,
        SUM(revenue) as revenue,
        SUM(clicks) as clicks
      FROM email_attribution_metrics
      WHERE merchant_id = $1
        AND date BETWEEN $2 AND $3
      GROUP BY flow_name, utm_campaign
      ORDER BY revenue DESC
    `

    const flows = await this.olapDb.query(query, [merchantId, startDate, endDate])

    const totalRevenue = flows.reduce(
      (sum: number, row: any) => sum + parseFloat(row.revenue || 0),
      0,
    )

    return {
      totalRevenue,
      flows: flows.map((row: any) => ({
        flowName: row.flowName,
        campaign: row.utmCampaign,
        revenue: parseFloat(row.revenue || 0),
        orders: parseInt(row.orders || 0, 10),
        clicks: parseInt(row.clicks || 0, 10),
        percentage: totalRevenue > 0 ? (parseFloat(row.revenue || 0) / totalRevenue) * 100 : 0,
      })),
    }
  }

  /**
   * Get overview metrics for dashboard
   */
  async getOverviewMetrics(merchantId: string): Promise<{
    last7Days: RevenueMetrics
    last30Days: RevenueMetrics
    emailAttribution: any
  }> {
    const now = new Date()
    const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [last7Days, last30Days, emailAttribution] = await Promise.all([
      this.getRevenueMetricsFromOLAP(merchantId, last7DaysStart, now),
      this.getRevenueMetricsFromOLAP(merchantId, last30DaysStart, now),
      this.getAttributionMetricsFromOLAP(merchantId, last30DaysStart, now),
    ])

    return {
      last7Days,
      last30Days,
      emailAttribution,
    }
  }

  /**
   * Compare current period vs baseline revenue
   */
  async compareRevenueToBaseline(
    merchantId: string,
    currentRevenue: number,
    baselineRevenue: number,
  ): Promise<{
    lift: number
    liftPercentage: number
    status: 'above' | 'below' | 'at'
  }> {
    const lift = currentRevenue - baselineRevenue
    const liftPercentage = baselineRevenue > 0 ? (lift / baselineRevenue) * 100 : 0

    let status: 'above' | 'below' | 'at' = 'at'
    if (liftPercentage > 1) status = 'above'
    else if (liftPercentage < -1) status = 'below'

    return {
      lift,
      liftPercentage,
      status,
    }
  }
}
