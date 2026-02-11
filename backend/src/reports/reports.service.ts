import { Injectable, Logger } from '@nestjs/common'
import { MetricsService } from '../metrics/metrics.service'
import { GatesService } from '../gates/gates.service'
import { OrdersService } from '../orders/orders.service'
import { subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns'

export interface WeeklyReport {
  weekEnding: Date
  baseline: {
    expected: number
    actual: number
    variance: number
    variancePercent: number
  }
  postPurchase: {
    revenue: number
    percentage: number
    trend: 'up' | 'down' | 'flat'
    changePercent: number
  }
  gates: {
    deliverability: string
    funnelThroughput: string
    croReview: string
    offerValidation: string
  }
  alerts: Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    message: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    estimatedImpact: string
  }>
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name)

  constructor(
    private readonly metricsService: MetricsService,
    private readonly gatesService: GatesService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Generate Monday Ritual report for the current week
   */
  async generateWeeklyReport(merchantId: string): Promise<WeeklyReport> {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday

    this.logger.log(
      `Generating weekly report for merchant ${merchantId} (week ${weekStart.toISOString()} to ${weekEnd.toISOString()})`,
    )

    // Fetch all data in parallel
    const [baseline, postPurchaseMetrics, gates, previousWeekData] =
      await Promise.all([
        this.calculateBaselinePerformance(merchantId, weekStart, weekEnd),
        this.calculatePostPurchaseRevenue(merchantId, weekStart, weekEnd),
        this.fetchGateStatuses(merchantId),
        this.fetchPreviousWeekData(merchantId),
      ])

    // Calculate trends
    const postPurchaseTrend = this.calculateTrend(
      postPurchaseMetrics.percentage,
      previousWeekData.postPurchasePercentage,
    )

    // Generate alerts based on gates and metrics
    const alerts = this.generateAlerts(gates, baseline, postPurchaseMetrics)

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      merchantId,
      gates,
      baseline,
      postPurchaseMetrics,
    )

    const report: WeeklyReport = {
      weekEnding: weekEnd,
      baseline,
      postPurchase: {
        ...postPurchaseMetrics,
        trend: postPurchaseTrend.direction,
        changePercent: postPurchaseTrend.percent,
      },
      gates,
      alerts,
      recommendations,
    }

    return report
  }

  /**
   * Calculate baseline performance for the week
   */
  private async calculateBaselinePerformance(
    merchantId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{
    expected: number
    actual: number
    variance: number
    variancePercent: number
  }> {
    // Get baseline expectations
    const baseline = await this.metricsService.getBaseline(merchantId)

    if (!baseline) {
      return {
        expected: 0,
        actual: 0,
        variance: 0,
        variancePercent: 0,
      }
    }

    // Calculate expected revenue based on baseline day-of-week averages
    let expectedRevenue = 0
    const currentDate = new Date(weekStart)

    while (currentDate <= weekEnd) {
      const dayOfWeek = currentDate.getDay()
      expectedRevenue += baseline.baselineByDow[dayOfWeek] || 0
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Get actual revenue for the week
    const actualRevenue = await this.ordersService.getTotalRevenue(
      merchantId,
      weekStart,
      weekEnd,
    )

    const variance = actualRevenue - expectedRevenue
    const variancePercent =
      expectedRevenue > 0 ? (variance / expectedRevenue) * 100 : 0

    return {
      expected: expectedRevenue,
      actual: actualRevenue,
      variance,
      variancePercent,
    }
  }

  /**
   * Calculate post-purchase revenue metrics
   */
  private async calculatePostPurchaseRevenue(
    merchantId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{
    revenue: number
    percentage: number
  }> {
    const metrics = await this.metricsService.calculatePostPurchaseRevenue(
      merchantId,
      weekStart,
      weekEnd,
    )

    return {
      revenue: metrics.postPurchaseRevenue,
      percentage: metrics.postPurchasePercentage,
    }
  }

  /**
   * Fetch gate statuses
   */
  private async fetchGateStatuses(merchantId: string): Promise<{
    deliverability: string
    funnelThroughput: string
    croReview: string
    offerValidation: string
  }> {
    const gates = await this.gatesService.getAllGates(merchantId)

    const gateMap = gates.reduce(
      (acc, gate) => {
        acc[gate.gateType] = gate.status
        return acc
      },
      {} as Record<string, string>,
    )

    return {
      deliverability: gateMap.deliverability || 'pass',
      funnelThroughput: gateMap.funnel_throughput || 'pass',
      croReview: gateMap.cro_review || 'locked',
      offerValidation: gateMap.offer_validation || 'locked',
    }
  }

  /**
   * Fetch previous week data for trend calculation
   */
  private async fetchPreviousWeekData(merchantId: string): Promise<{
    postPurchasePercentage: number
  }> {
    const prevWeekStart = startOfWeek(subWeeks(new Date(), 1), {
      weekStartsOn: 1,
    })
    const prevWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    const prevMetrics = await this.metricsService.calculatePostPurchaseRevenue(
      merchantId,
      prevWeekStart,
      prevWeekEnd,
    )

    return {
      postPurchasePercentage: prevMetrics.postPurchasePercentage,
    }
  }

  /**
   * Calculate trend direction and percentage change
   */
  private calculateTrend(
    current: number,
    previous: number,
  ): { direction: 'up' | 'down' | 'flat'; percent: number } {
    if (previous === 0) {
      return { direction: 'flat', percent: 0 }
    }

    const change = current - previous
    const percent = (change / previous) * 100

    if (Math.abs(percent) < 1) {
      return { direction: 'flat', percent: 0 }
    }

    return {
      direction: change > 0 ? 'up' : 'down',
      percent: Math.abs(percent),
    }
  }

  /**
   * Generate alerts based on gate statuses and metrics
   */
  private generateAlerts(
    gates: any,
    baseline: any,
    postPurchase: any,
  ): Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    message: string
  }> {
    const alerts: Array<{
      type: 'critical' | 'warning' | 'info'
      title: string
      message: string
    }> = []

    // Check gate failures
    if (gates.deliverability === 'fail') {
      alerts.push({
        type: 'critical',
        title: 'Deliverability gate FAILED',
        message:
          'Email deliverability below threshold. Promotions and campaigns are blocked.',
      })
    } else if (gates.deliverability === 'grace_period') {
      alerts.push({
        type: 'warning',
        title: 'Deliverability grace period active',
        message:
          'Fix deliverability issues within 24 hours or features will be blocked.',
      })
    } else if (gates.deliverability === 'warning') {
      alerts.push({
        type: 'warning',
        title: 'Deliverability approaching threshold',
        message: 'Monitor bounce rates and spam complaints closely.',
      })
    }

    // Check baseline variance
    if (baseline.variancePercent < -10) {
      alerts.push({
        type: 'warning',
        title: 'Revenue below baseline',
        message: `Actual revenue is ${Math.abs(baseline.variancePercent).toFixed(1)}% below expected. Investigate traffic or conversion issues.`,
      })
    }

    // Check post-purchase percentage
    if (postPurchase.percentage < 15) {
      alerts.push({
        type: 'info',
        title: 'Low post-purchase revenue',
        message:
          'Post-purchase revenue is below 15%. Activate more lifecycle flows to improve.',
      })
    }

    return alerts
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    merchantId: string,
    gates: any,
    baseline: any,
    postPurchase: any,
  ): Promise<
    Array<{
      priority: 'high' | 'medium' | 'low'
      title: string
      description: string
      estimatedImpact: string
    }>
  > {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      title: string
      description: string
      estimatedImpact: string
    }> = []

    // Post-purchase optimization
    if (postPurchase.percentage < 20) {
      recommendations.push({
        priority: 'high',
        title: 'Activate lifecycle flows for new customers',
        description:
          'Significant opportunity to increase post-purchase revenue by ensuring all new customers enter appropriate lifecycle flows.',
        estimatedImpact: `+$${Math.round(baseline.actual * 0.03)}-$${Math.round(baseline.actual * 0.05)}/week`,
      })
    }

    // Deliverability maintenance
    if (gates.deliverability === 'pass') {
      recommendations.push({
        priority: 'low',
        title: 'Maintain list hygiene',
        description:
          'Continue regular list cleaning and engagement monitoring to maintain strong deliverability.',
        estimatedImpact: 'Prevents future revenue loss',
      })
    }

    return recommendations
  }
}
