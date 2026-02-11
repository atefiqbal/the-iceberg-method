import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Customer } from './entities/customer.entity'

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name)

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  /**
   * Find or create customer from Shopify data
   */
  async findOrCreateFromShopifyData(
    merchantId: string,
    shopifyCustomer: any,
  ): Promise<Customer> {
    // Try to find existing customer
    let customer = await this.customersRepository.findOne({
      where: {
        merchantId,
        shopifyCustomerId: shopifyCustomer.id.toString(),
      },
    })

    if (customer) {
      // Update customer info if changed
      customer.email = shopifyCustomer.email || customer.email
      customer.phone = shopifyCustomer.phone || customer.phone
      customer.firstName = shopifyCustomer.first_name || customer.firstName
      customer.lastName = shopifyCustomer.last_name || customer.lastName
      await this.customersRepository.save(customer)
      return customer
    }

    // Create new customer
    customer = this.customersRepository.create({
      merchantId,
      shopifyCustomerId: shopifyCustomer.id.toString(),
      email: shopifyCustomer.email,
      phone: shopifyCustomer.phone,
      firstName: shopifyCustomer.first_name,
      lastName: shopifyCustomer.last_name,
      isPostPurchase: false, // Will be updated when first order is processed
      totalOrders: 0,
      lifetimeValue: 0,
      currentProductStep: 0,
    })

    await this.customersRepository.save(customer)

    this.logger.log(
      `Created customer ${customer.id} (Shopify: ${shopifyCustomer.id}) for merchant ${merchantId}`,
    )

    return customer
  }

  /**
   * Create customer from webhook
   */
  async createFromWebhook(merchantId: string, shopifyCustomer: any): Promise<Customer> {
    return await this.findOrCreateFromShopifyData(merchantId, shopifyCustomer)
  }

  /**
   * Update customer from webhook
   */
  async updateFromWebhook(merchantId: string, shopifyCustomer: any): Promise<Customer> {
    return await this.findOrCreateFromShopifyData(merchantId, shopifyCustomer)
  }

  /**
   * Create or update customer from Shopify (used by backfill)
   */
  async createOrUpdateFromShopify(merchantId: string, shopifyCustomer: any): Promise<Customer> {
    return await this.findOrCreateFromShopifyData(merchantId, shopifyCustomer)
  }

  /**
   * Update customer stats when order is created
   */
  async updateStatsFromOrder(
    customerId: string,
    orderValue: number,
    orderDate: Date,
  ): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId },
    })

    if (!customer) {
      this.logger.error(`Customer ${customerId} not found for stats update`)
      return
    }

    // Update stats
    customer.totalOrders += 1
    customer.lifetimeValue += orderValue
    customer.lastPurchaseAt = orderDate

    // Set isPostPurchase to true on first order
    if (!customer.isPostPurchase) {
      customer.isPostPurchase = true
      customer.firstPurchaseAt = orderDate
      this.logger.log(`Customer ${customerId} converted to post-purchase`)
    }

    await this.customersRepository.save(customer)
  }

  /**
   * Update customer LTV (for order updates)
   */
  async updateLTV(customerId: string, delta: number): Promise<void> {
    await this.customersRepository.increment(
      { id: customerId },
      'lifetimeValue',
      delta,
    )
  }

  /**
   * Find customer by ID
   */
  async findOne(id: string): Promise<Customer | null> {
    return await this.customersRepository.findOne({
      where: { id },
    })
  }

  /**
   * Find customer by Shopify ID
   */
  async findByShopifyId(merchantId: string, shopifyCustomerId: string): Promise<Customer | null> {
    return await this.customersRepository.findOne({
      where: {
        merchantId,
        shopifyCustomerId,
      },
    })
  }
}
