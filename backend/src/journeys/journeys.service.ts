import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CustomerJourney,
  JourneyStage,
  ProductStep,
  FlowState,
} from './entities/customer-journey.entity'
import {
  JourneyEvent,
  JourneyEventType,
} from './entities/journey-event.entity'
import { CustomersService } from '../customers/customers.service'
import { KlaviyoService } from '../klaviyo/klaviyo.service'

@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name)

  constructor(
    @InjectRepository(CustomerJourney)
    private journeyRepository: Repository<CustomerJourney>,
    @InjectRepository(JourneyEvent)
    private eventRepository: Repository<JourneyEvent>,
    private customersService: CustomersService,
    private klaviyoService: KlaviyoService,
  ) {}

  /**
   * Get or create journey state for a customer
   */
  async getOrCreateJourney(
    merchantId: string,
    customerId: string,
  ): Promise<CustomerJourney> {
    let journey = await this.journeyRepository.findOne({
      where: { merchantId, customerId },
    })

    if (!journey) {
      journey = this.journeyRepository.create({
        merchantId,
        customerId,
        journeyStage: JourneyStage.PRE_PURCHASE,
        productStep: ProductStep.STEP_0,
        currentFlow: FlowState.NONE,
      })
      await this.journeyRepository.save(journey)

      this.logger.log(`Created journey for customer ${customerId}`)
    }

    return journey
  }

  /**
   * Handle first purchase - transition to post-purchase
   */
  async handleFirstPurchase(
    merchantId: string,
    customerId: string,
    orderData: {
      revenue: number
      purchasedAt: Date
      productSku?: string
    },
  ): Promise<void> {
    const journey = await this.getOrCreateJourney(merchantId, customerId)

    // Transition to post-purchase stage
    journey.journeyStage = JourneyStage.POST_PURCHASE
    journey.productStep = ProductStep.STEP_1
    journey.firstPurchaseAt = orderData.purchasedAt
    journey.lastPurchaseAt = orderData.purchasedAt
    journey.totalPurchases = 1
    journey.lifetimeValue = orderData.revenue

    await this.journeyRepository.save(journey)

    // Log event
    await this.logEvent(merchantId, customerId, JourneyEventType.FIRST_PURCHASE, {
      revenue: orderData.revenue,
      productSku: orderData.productSku,
    })

    this.logger.log(
      `Customer ${customerId} transitioned to POST_PURCHASE, STEP_1`,
    )

    // Trigger post-purchase flow
    await this.triggerFlow(
      merchantId,
      customerId,
      FlowState.POST_PURCHASE_EDUCATION,
    )
  }

  /**
   * Handle repeat purchase - advance product step if applicable
   */
  async handleRepeatPurchase(
    merchantId: string,
    customerId: string,
    orderData: {
      revenue: number
      purchasedAt: Date
      productSku?: string
    },
  ): Promise<void> {
    const journey = await this.getOrCreateJourney(merchantId, customerId)

    // Update purchase stats
    journey.lastPurchaseAt = orderData.purchasedAt
    journey.totalPurchases += 1
    journey.lifetimeValue += orderData.revenue

    // Advance product step if applicable (simplified logic)
    // In production, this would check product hierarchy
    if (journey.productStep < ProductStep.STEP_3) {
      const newStep = (journey.productStep + 1) as ProductStep
      journey.productStep = newStep

      await this.logEvent(
        merchantId,
        customerId,
        JourneyEventType.PRODUCT_STEP_ADVANCED,
        {
          fromStep: journey.productStep,
          toStep: newStep,
        },
      )

      this.logger.log(
        `Customer ${customerId} advanced to product step ${newStep}`,
      )
    }

    await this.journeyRepository.save(journey)

    // Log repeat purchase
    await this.logEvent(
      merchantId,
      customerId,
      JourneyEventType.REPEAT_PURCHASE,
      {
        revenue: orderData.revenue,
        productSku: orderData.productSku,
        totalPurchases: journey.totalPurchases,
      },
    )
  }

  /**
   * Trigger a lifecycle flow for a customer
   */
  async triggerFlow(
    merchantId: string,
    customerId: string,
    flowState: FlowState,
  ): Promise<void> {
    const journey = await this.getOrCreateJourney(merchantId, customerId)
    const customer = await this.customersService.findOne(customerId)

    if (!customer || !customer.email) {
      this.logger.warn(
        `Cannot trigger flow ${flowState} for customer ${customerId}: no email found`,
      )
      return
    }

    // Update current flow
    journey.currentFlow = flowState
    journey.lastEmailSentAt = new Date()

    await this.journeyRepository.save(journey)

    // Log flow entry
    await this.logEvent(merchantId, customerId, JourneyEventType.FLOW_ENTERED, {
      flowName: flowState,
    })

    this.logger.log(`Customer ${customerId} entered flow: ${flowState}`)

    // Update Klaviyo profile with journey state
    try {
      await this.klaviyoService.updateCustomerProfile(merchantId, customer.email, {
        journeyStage: journey.journeyStage,
        productStep: journey.productStep,
        currentFlow: journey.currentFlow,
        lifetimeValue: Number(journey.lifetimeValue),
        totalPurchases: journey.totalPurchases,
      })

      // Trigger the lifecycle flow in Klaviyo
      await this.klaviyoService.triggerLifecycleFlow(
        merchantId,
        customer.email,
        flowState,
        {
          journey_stage: journey.journeyStage,
          product_step: journey.productStep,
        },
      )

      // Log email sent event
      await this.logEvent(
        merchantId,
        customerId,
        JourneyEventType.FLOW_EMAIL_SENT,
        {
          flowName: flowState,
          email: customer.email,
        },
      )
    } catch (error) {
      this.logger.error(
        `Failed to trigger Klaviyo flow ${flowState} for customer ${customerId}: ${error.message}`,
        error.stack,
      )
      // Continue even if Klaviyo fails - we've still logged the intent
    }
  }

  /**
   * Mark flow as completed
   */
  async completeFlow(
    merchantId: string,
    customerId: string,
    flowState: FlowState,
  ): Promise<void> {
    const journey = await this.getOrCreateJourney(merchantId, customerId)

    // Clear current flow if it matches
    if (journey.currentFlow === flowState) {
      journey.currentFlow = FlowState.NONE
      journey.lastFlowCompletedAt = new Date()
      await this.journeyRepository.save(journey)
    }

    // Log completion
    await this.logEvent(
      merchantId,
      customerId,
      JourneyEventType.FLOW_COMPLETED,
      {
        flowName: flowState,
      },
    )

    this.logger.log(`Customer ${customerId} completed flow: ${flowState}`)
  }

  /**
   * Handle cart abandonment
   */
  async handleCartAbandonment(
    merchantId: string,
    customerId: string,
    cartData: any,
  ): Promise<void> {
    await this.logEvent(
      merchantId,
      customerId,
      JourneyEventType.ABANDONED_CART,
      cartData,
    )

    // Trigger abandoned cart flow
    await this.triggerFlow(merchantId, customerId, FlowState.ABANDONED_CART)
  }

  /**
   * Handle checkout abandonment
   */
  async handleCheckoutAbandonment(
    merchantId: string,
    customerId: string,
    checkoutData: any,
  ): Promise<void> {
    await this.logEvent(
      merchantId,
      customerId,
      JourneyEventType.ABANDONED_CHECKOUT,
      checkoutData,
    )

    // Trigger abandoned checkout flow (higher intent)
    await this.triggerFlow(
      merchantId,
      customerId,
      FlowState.ABANDONED_CHECKOUT,
    )
  }

  /**
   * Get journey stats for a merchant
   */
  async getJourneyStats(merchantId: string): Promise<{
    total: number
    byStage: Record<string, number>
    byProductStep: Record<string, number>
    byFlow: Record<string, number>
  }> {
    const journeys = await this.journeyRepository.find({
      where: { merchantId },
    })

    const stats = {
      total: journeys.length,
      byStage: {} as Record<string, number>,
      byProductStep: {} as Record<string, number>,
      byFlow: {} as Record<string, number>,
    }

    journeys.forEach((journey) => {
      // Count by stage
      stats.byStage[journey.journeyStage] =
        (stats.byStage[journey.journeyStage] || 0) + 1

      // Count by product step
      stats.byProductStep[`step_${journey.productStep}`] =
        (stats.byProductStep[`step_${journey.productStep}`] || 0) + 1

      // Count by current flow
      stats.byFlow[journey.currentFlow] =
        (stats.byFlow[journey.currentFlow] || 0) + 1
    })

    return stats
  }

  /**
   * Get customers in a specific journey state
   */
  async getCustomersByState(
    merchantId: string,
    filters: {
      journeyStage?: JourneyStage
      productStep?: ProductStep
      currentFlow?: FlowState
    },
  ): Promise<CustomerJourney[]> {
    return await this.journeyRepository.find({
      where: {
        merchantId,
        ...filters,
      },
    })
  }

  /**
   * Log a journey event
   */
  private async logEvent(
    merchantId: string,
    customerId: string,
    eventType: JourneyEventType,
    eventData?: Record<string, any>,
  ): Promise<void> {
    const event = this.eventRepository.create({
      merchantId,
      customerId,
      eventType,
      eventData,
    })

    await this.eventRepository.save(event)
  }

  /**
   * Get journey events for analytics
   */
  async getJourneyEvents(
    merchantId: string,
    customerId: string,
    limit: number = 50,
  ): Promise<JourneyEvent[]> {
    return await this.eventRepository.find({
      where: { merchantId, customerId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }
}
