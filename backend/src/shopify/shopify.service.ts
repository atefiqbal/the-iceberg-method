import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MerchantIntegration, IntegrationProvider, IntegrationStatus } from '../merchants/entities/merchant-integration.entity'

export interface ShopifyOrdersQuery {
  limit?: number
  sinceId?: string | null
  createdAtMin?: string
  createdAtMax?: string
  status?: 'open' | 'closed' | 'cancelled' | 'any'
  fields?: string
}

export interface ShopifyOrdersResponse {
  orders: any[]
  hasNextPage?: boolean
}

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name)

  constructor(
    @InjectRepository(MerchantIntegration)
    private readonly integrationRepository: Repository<MerchantIntegration>,
  ) {}

  /**
   * Get orders from Shopify with pagination support
   */
  async getOrders(
    merchantId: string,
    query: ShopifyOrdersQuery = {},
  ): Promise<ShopifyOrdersResponse> {
    const integration = await this.getShopifyIntegration(merchantId)

    const params = new URLSearchParams()
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.sinceId) params.append('since_id', query.sinceId)
    if (query.createdAtMin) params.append('created_at_min', query.createdAtMin)
    if (query.createdAtMax) params.append('created_at_max', query.createdAtMax)
    if (query.status) params.append('status', query.status)
    if (query.fields) params.append('fields', query.fields)

    const url = `https://${integration.config.shop_domain}/admin/api/2024-01/orders.json?${params.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': integration.config.access_token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      return {
        orders: data.orders || [],
        hasNextPage: data.orders?.length === (query.limit || 50),
      }
    } catch (error) {
      this.logger.error(`Failed to fetch orders from Shopify: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get a single order from Shopify
   */
  async getOrder(merchantId: string, orderId: string): Promise<any> {
    const integration = await this.getShopifyIntegration(merchantId)

    const url = `https://${integration.config.shop_domain}/admin/api/2024-01/orders/${orderId}.json`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': integration.config.access_token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.order
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId} from Shopify: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get customers from Shopify
   */
  async getCustomers(
    merchantId: string,
    query: { limit?: number; sinceId?: string | null } = {},
  ): Promise<any[]> {
    const integration = await this.getShopifyIntegration(merchantId)

    const params = new URLSearchParams()
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.sinceId) params.append('since_id', query.sinceId)

    const url = `https://${integration.config.shop_domain}/admin/api/2024-01/customers.json?${params.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': integration.config.access_token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.customers || []
    } catch (error) {
      this.logger.error(`Failed to fetch customers from Shopify: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get products from Shopify
   */
  async getProducts(
    merchantId: string,
    query: { limit?: number; sinceId?: string | null } = {},
  ): Promise<any[]> {
    const integration = await this.getShopifyIntegration(merchantId)

    const params = new URLSearchParams()
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.sinceId) params.append('since_id', query.sinceId)

    const url = `https://${integration.config.shop_domain}/admin/api/2024-01/products.json?${params.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': integration.config.access_token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      this.logger.error(`Failed to fetch products from Shopify: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get Shopify integration for a merchant
   */
  private async getShopifyIntegration(merchantId: string): Promise<MerchantIntegration> {
    const integration = await this.integrationRepository.findOne({
      where: {
        merchantId,
        provider: IntegrationProvider.SHOPIFY,
        status: IntegrationStatus.ACTIVE,
      },
    })

    if (!integration) {
      throw new Error(`No active Shopify integration found for merchant ${merchantId}`)
    }

    if (!integration.config?.shop_domain || !integration.config?.access_token) {
      throw new Error(`Invalid Shopify integration configuration for merchant ${merchantId}`)
    }

    return integration
  }
}
