import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Merchant, MerchantStatus } from '../merchants/entities/merchant.entity'

interface ETLCheckpoint {
  merchantId: string
  lastProcessedEventId: string
  lastProcessedAt: Date
}

interface DailyRevenueAggregate {
  merchantId: string
  date: string
  deviceType: string
  revenue: number
  orderCount: number
  sessions: number
  addToCart: number
  checkoutInitiated: number
}

@Injectable()
export class ETLService {
  private readonly logger = new Logger(ETLService.name)

  constructor(
    @InjectDataSource() private readonly oltpDb: DataSource,
    @InjectDataSource('analytics') private readonly olapDb: DataSource,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Hourly ETL job - runs at :00 of each hour
   * Moves data from OLTP to OLAP for analytics
   */
  @Cron('0 * * * *') // Every hour at :00
  async runHourlyETL() {
    this.logger.log('Starting hourly ETL job')

    try {
      const merchants = await this.merchantRepository.find({
        where: { status: MerchantStatus.ACTIVE },
      })

      let successCount = 0
      let failureCount = 0

      for (const merchant of merchants) {
        try {
          await this.processETLForMerchant(merchant.id)
          successCount++
        } catch (error) {
          this.logger.error(
            `ETL failed for merchant ${merchant.id}: ${error.message}`,
            error.stack,
          )
          failureCount++
        }
      }

      this.logger.log(
        `Hourly ETL completed: ${successCount} merchants processed, ${failureCount} failures`,
      )
    } catch (error) {
      this.logger.error(`Hourly ETL job failed: ${error.message}`, error.stack)
    }
  }

  /**
   * Process ETL for a specific merchant
   * Idempotent using checkpoint pattern
   */
  async processETLForMerchant(merchantId: string): Promise<void> {
    const startTime = Date.now()

    // 1. Load checkpoint
    const checkpoint = await this.getETLCheckpoint(merchantId)

    this.logger.log(`Starting ETL for merchant ${merchantId}`, {
      lastCheckpoint: checkpoint?.lastProcessedEventId,
      lastProcessedAt: checkpoint?.lastProcessedAt,
    })

    // 2. Fetch new orders from OLTP since checkpoint
    const orders = await this.fetchNewOrders(merchantId, checkpoint)

    if (orders.length === 0) {
      this.logger.log(`No new orders for merchant ${merchantId}`)
      return
    }

    this.logger.log(`Processing ${orders.length} new orders for merchant ${merchantId}`)

    // 3. Begin transaction in OLAP DB
    const queryRunner = this.olapDb.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 4. Aggregate orders by date and device type
      const revenueAggregates = this.aggregateDailyRevenue(orders)

      // 5. Aggregate email attribution metrics
      const attributionAggregates = this.aggregateEmailAttribution(orders)

      // 6. Upsert revenue metrics into OLAP database
      for (const aggregate of revenueAggregates) {
        await this.upsertDailyRevenue(aggregate, queryRunner)
      }

      // 7. Upsert attribution metrics
      for (const aggregate of attributionAggregates) {
        await this.upsertEmailAttribution(aggregate, queryRunner)
      }

      // 8. Update checkpoint
      const newCheckpoint = {
        merchantId,
        lastProcessedEventId: orders[orders.length - 1].id,
        lastProcessedAt: new Date(),
      }
      await this.saveETLCheckpoint(newCheckpoint, queryRunner)

      // 9. Commit transaction
      await queryRunner.commitTransaction()

      const duration = Date.now() - startTime
      this.logger.log(`ETL completed for merchant ${merchantId}`, {
        ordersProcessed: orders.length,
        revenueAggregates: revenueAggregates.length,
        attributionAggregates: attributionAggregates.length,
        duration: `${duration}ms`,
      })
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Fetch new orders from OLTP database since last checkpoint
   */
  private async fetchNewOrders(
    merchantId: string,
    checkpoint: ETLCheckpoint | null,
  ): Promise<any[]> {
    const query = `
      SELECT
        o.id,
        o.merchant_id,
        o.customer_id,
        o.revenue,
        o.device_type,
        o.attribution_source,
        o.attribution_flow_type,
        o.utm_campaign,
        o.created_at,
        DATE_TRUNC('day', o.created_at AT TIME ZONE m.timezone) AS date_in_tz
      FROM orders o
      JOIN merchants m ON m.id = o.merchant_id
      WHERE o.merchant_id = $1
        AND ($2::UUID IS NULL OR o.id > $2)
      ORDER BY o.id ASC
      LIMIT 10000
    `

    const result = await this.oltpDb.query(query, [
      merchantId,
      checkpoint?.lastProcessedEventId || null,
    ])

    return result
  }

  /**
   * Aggregate orders into daily revenue metrics
   */
  private aggregateDailyRevenue(orders: any[]): DailyRevenueAggregate[] {
    const aggregateMap = new Map<string, DailyRevenueAggregate>()

    for (const order of orders) {
      const key = `${order.merchant_id}:${order.date_in_tz}:${order.device_type || 'unknown'}`

      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          merchantId: order.merchant_id,
          date: order.date_in_tz,
          deviceType: order.device_type || 'unknown',
          revenue: 0,
          orderCount: 0,
          sessions: 0, // TODO: Track sessions from checkout webhooks
          addToCart: 0, // TODO: Track ATC from cart webhooks
          checkoutInitiated: 0, // TODO: Track from checkout webhooks
        })
      }

      const aggregate = aggregateMap.get(key)!
      aggregate.revenue += parseFloat(order.revenue)
      aggregate.orderCount += 1
    }

    return Array.from(aggregateMap.values())
  }

  /**
   * Aggregate email attribution metrics
   */
  private aggregateEmailAttribution(orders: any[]): Array<{
    merchantId: string
    date: string
    flowName: string
    utmCampaign: string
    revenue: number
    orderCount: number
  }> {
    const aggregateMap = new Map<
      string,
      {
        merchantId: string
        date: string
        flowName: string
        utmCampaign: string
        revenue: number
        orderCount: number
      }
    >()

    for (const order of orders) {
      // Only aggregate orders with email attribution
      if (order.attribution_source !== 'iceberg_email') {
        continue
      }

      const flowName = order.attribution_flow_type || 'unknown'
      const utmCampaign = order.utm_campaign || 'unknown'
      const key = `${order.merchant_id}:${order.date_in_tz}:${flowName}:${utmCampaign}`

      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          merchantId: order.merchant_id,
          date: order.date_in_tz,
          flowName,
          utmCampaign,
          revenue: 0,
          orderCount: 0,
        })
      }

      const aggregate = aggregateMap.get(key)!
      aggregate.revenue += parseFloat(order.revenue)
      aggregate.orderCount += 1
    }

    return Array.from(aggregateMap.values())
  }

  /**
   * Upsert daily revenue aggregate into OLAP database
   */
  private async upsertDailyRevenue(
    aggregate: DailyRevenueAggregate,
    queryRunner: any,
  ): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO daily_revenue_metrics (
        merchant_id, date, device_type, revenue, order_count, sessions, add_to_cart, checkout_initiated
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (merchant_id, date, device_type)
      DO UPDATE SET
        revenue = daily_revenue_metrics.revenue + EXCLUDED.revenue,
        order_count = daily_revenue_metrics.order_count + EXCLUDED.order_count,
        sessions = daily_revenue_metrics.sessions + EXCLUDED.sessions,
        add_to_cart = daily_revenue_metrics.add_to_cart + EXCLUDED.add_to_cart,
        checkout_initiated = daily_revenue_metrics.checkout_initiated + EXCLUDED.checkout_initiated,
        updated_at = NOW()
    `,
      [
        aggregate.merchantId,
        aggregate.date,
        aggregate.deviceType,
        aggregate.revenue,
        aggregate.orderCount,
        aggregate.sessions,
        aggregate.addToCart,
        aggregate.checkoutInitiated,
      ],
    )
  }

  /**
   * Get ETL checkpoint for a merchant
   */
  private async getETLCheckpoint(merchantId: string): Promise<ETLCheckpoint | null> {
    const result = await this.olapDb.query(
      `
      SELECT merchant_id, last_processed_event_id, last_processed_at
      FROM etl_checkpoints
      WHERE merchant_id = $1
    `,
      [merchantId],
    )

    if (result.length === 0) return null

    return {
      merchantId: result[0].merchant_id,
      lastProcessedEventId: result[0].last_processed_event_id,
      lastProcessedAt: result[0].last_processed_at,
    }
  }

  /**
   * Save ETL checkpoint
   */
  private async saveETLCheckpoint(
    checkpoint: ETLCheckpoint,
    queryRunner: any,
  ): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO etl_checkpoints (merchant_id, last_processed_event_id, last_processed_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (merchant_id)
      DO UPDATE SET
        last_processed_event_id = EXCLUDED.last_processed_event_id,
        last_processed_at = EXCLUDED.last_processed_at
    `,
      [checkpoint.merchantId, checkpoint.lastProcessedEventId, checkpoint.lastProcessedAt],
    )
  }

  /**
   * Upsert email attribution metrics into OLAP database
   */
  private async upsertEmailAttribution(
    aggregate: {
      merchantId: string
      date: string
      flowName: string
      utmCampaign: string
      revenue: number
      orderCount: number
    },
    queryRunner: any,
  ): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO email_attribution_metrics (
        merchant_id, date, flow_name, utm_campaign, clicks, orders, revenue
      )
      VALUES ($1, $2, $3, $4, 0, $5, $6)
      ON CONFLICT (merchant_id, date, flow_name, COALESCE(utm_campaign, ''))
      DO UPDATE SET
        orders = email_attribution_metrics.orders + EXCLUDED.orders,
        revenue = email_attribution_metrics.revenue + EXCLUDED.revenue,
        updated_at = NOW()
    `,
      [
        aggregate.merchantId,
        aggregate.date,
        aggregate.flowName,
        aggregate.utmCampaign || null,
        aggregate.orderCount,
        aggregate.revenue,
      ],
    )
  }

  /**
   * Manually trigger ETL for a merchant (for testing/recovery)
   */
  async triggerManualETL(merchantId: string): Promise<void> {
    this.logger.log(`Manual ETL triggered for merchant ${merchantId}`)
    await this.processETLForMerchant(merchantId)
  }

  /**
   * Refresh materialized views after ETL
   */
  async refreshMaterializedViews(): Promise<void> {
    this.logger.log('Refreshing materialized views')

    try {
      await this.olapDb.query('REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics')
      this.logger.log('Materialized views refreshed successfully')
    } catch (error) {
      this.logger.error(`Failed to refresh materialized views: ${error.message}`, error.stack)
    }
  }
}
