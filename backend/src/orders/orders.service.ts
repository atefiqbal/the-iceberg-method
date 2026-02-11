import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order, DeviceType } from './entities/order.entity'
import { CustomersService } from '../customers/customers.service'

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private customersService: CustomersService,
  ) {}

  /**
   * Create order from Shopify webhook
   */
  async createFromWebhook(merchantId: string, shopifyOrder: any): Promise<Order> {
    try {
      // Check if order already exists (idempotency)
      const existing = await this.ordersRepository.findOne({
        where: {
          merchantId,
          shopifyOrderId: shopifyOrder.id.toString(),
        },
      })

      if (existing) {
        this.logger.warn(`Order ${shopifyOrder.id} already exists, skipping`)
        return existing
      }

      // Find or create customer
      let customer = null
      if (shopifyOrder.customer) {
        customer = await this.customersService.findOrCreateFromShopifyData(
          merchantId,
          shopifyOrder.customer,
        )
      }

      // Extract device type from client details
      const deviceType = this.extractDeviceType(shopifyOrder.client_details)

      // Extract UTM parameters from landing_site_ref
      const utmParams = this.extractUTMParams(shopifyOrder.landing_site_ref || '')

      // Determine attribution
      const attribution = this.determineAttribution(utmParams)

      // Create order
      const order = this.ordersRepository.create({
        merchantId,
        customerId: customer?.id || null,
        shopifyOrderId: shopifyOrder.id.toString(),
        revenue: parseFloat(shopifyOrder.total_price || 0),
        deviceType,
        attributionSource: attribution.source,
        attributionFlowType: attribution.flowType,
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign,
        createdAt: new Date(shopifyOrder.created_at),
      })

      await this.ordersRepository.save(order)

      // Update customer stats if customer exists
      if (customer) {
        await this.customersService.updateStatsFromOrder(
          customer.id,
          parseFloat(shopifyOrder.total_price || 0),
          new Date(shopifyOrder.created_at),
        )
      }

      this.logger.log(
        `Created order ${order.id} (Shopify: ${shopifyOrder.id}) for merchant ${merchantId}`,
      )

      return order
    } catch (error) {
      this.logger.error(
        `Failed to create order from webhook: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Update order from Shopify webhook
   */
  async updateFromWebhook(merchantId: string, shopifyOrder: any): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: {
        merchantId,
        shopifyOrderId: shopifyOrder.id.toString(),
      },
    })

    if (!order) {
      // Order doesn't exist, create it
      return await this.createFromWebhook(merchantId, shopifyOrder)
    }

    // Update revenue if changed
    const newRevenue = parseFloat(shopifyOrder.total_price || 0)
    if (order.revenue !== newRevenue) {
      const revenueDelta = newRevenue - order.revenue
      order.revenue = newRevenue
      await this.ordersRepository.save(order)

      // Update customer LTV if customer exists
      if (order.customerId) {
        await this.customersService.updateLTV(order.customerId, revenueDelta)
      }
    }

    return order
  }

  /**
   * Extract device type from Shopify client details
   */
  private extractDeviceType(clientDetails: any): DeviceType {
    if (!clientDetails) return DeviceType.UNKNOWN

    // Shopify provides browser_width which we can use
    const width = clientDetails.browser_width

    if (!width) return DeviceType.UNKNOWN

    // Mobile typically < 768px, tablet 768-1024px, desktop > 1024px
    if (width < 768) return DeviceType.MOBILE
    if (width < 1024) return DeviceType.TABLET
    return DeviceType.DESKTOP
  }

  /**
   * Extract UTM parameters from URL
   */
  private extractUTMParams(url: string): {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  } {
    try {
      const urlObj = new URL(url, 'https://example.com') // Need base URL for parsing
      return {
        utm_source: urlObj.searchParams.get('utm_source') || undefined,
        utm_medium: urlObj.searchParams.get('utm_medium') || undefined,
        utm_campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      }
    } catch {
      return {}
    }
  }

  /**
   * Determine attribution source and flow type
   */
  private determineAttribution(utmParams: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }): {
    source: string
    flowType?: string
  } {
    // Check if from Iceberg Method email flows
    if (utmParams.utm_source === 'iceberg-method' && utmParams.utm_medium === 'email') {
      return {
        source: 'iceberg_email',
        flowType: utmParams.utm_campaign, // e.g., 'abandoned_cart', 'win_back'
      }
    }

    // Other attribution sources
    if (utmParams.utm_source && utmParams.utm_medium) {
      return {
        source: `${utmParams.utm_source}_${utmParams.utm_medium}`,
        flowType: undefined,
      }
    }

    return {
      source: 'other',
      flowType: undefined,
    }
  }

  /**
   * Get orders for merchant in date range
   */
  async findByMerchantAndDateRange(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Order[]> {
    return await this.ordersRepository.find({
      where: {
        merchantId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: {
        createdAt: 'DESC',
      },
    })
  }

  /**
   * Get total revenue for merchant in date range
   */
  async getTotalRevenue(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.revenue)', 'total')
      .where('order.merchantId = :merchantId', { merchantId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .getRawOne()

    return parseFloat(result.total || 0)
  }
}
