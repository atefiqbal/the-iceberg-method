import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { JourneysService } from './journeys.service'
import { JourneyStage, ProductStep, FlowState } from './entities/customer-journey.entity'

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  /**
   * Get journey state for a specific customer
   */
  @Get(':merchantId/customers/:customerId')
  async getCustomerJourney(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
  ) {
    return await this.journeysService.getOrCreateJourney(merchantId, customerId)
  }

  /**
   * Get journey statistics for merchant
   */
  @Get(':merchantId/stats')
  async getJourneyStats(@Param('merchantId') merchantId: string) {
    return await this.journeysService.getJourneyStats(merchantId)
  }

  /**
   * Query customers by journey state
   */
  @Get(':merchantId/customers')
  async getCustomersByState(
    @Param('merchantId') merchantId: string,
    @Query('journeyStage') journeyStage?: JourneyStage,
    @Query('productStep') productStep?: string,
    @Query('currentFlow') currentFlow?: FlowState,
  ) {
    const filters: any = {}
    if (journeyStage) {
      filters.journeyStage = journeyStage
    }
    if (productStep !== undefined) {
      filters.productStep = parseInt(productStep, 10) as ProductStep
    }
    if (currentFlow) {
      filters.currentFlow = currentFlow
    }
    return await this.journeysService.getCustomersByState(merchantId, filters)
  }

  /**
   * Get journey events for a customer
   */
  @Get(':merchantId/customers/:customerId/events')
  async getJourneyEvents(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
    @Query('limit') limit?: string,
  ) {
    const eventLimit = limit ? parseInt(limit, 10) : 50
    return await this.journeysService.getJourneyEvents(
      merchantId,
      customerId,
      eventLimit,
    )
  }

  /**
   * Manually trigger a flow for a customer
   */
  @Post(':merchantId/customers/:customerId/flows')
  async triggerFlow(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
    @Body('flowState') flowState: FlowState,
  ) {
    await this.journeysService.triggerFlow(merchantId, customerId, flowState)
    return { success: true }
  }

  /**
   * Mark a flow as completed
   */
  @Post(':merchantId/customers/:customerId/flows/complete')
  async completeFlow(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
    @Body('flowState') flowState: FlowState,
  ) {
    await this.journeysService.completeFlow(merchantId, customerId, flowState)
    return { success: true }
  }
}
