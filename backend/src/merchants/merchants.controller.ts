import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { MerchantsService } from './merchants.service'
import { ProductLadderService } from './product-ladder.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ProductLadderStep } from './entities/product-ladder.entity'

@Controller('merchants')
@UseGuards(JwtAuthGuard)
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly productLadderService: ProductLadderService,
  ) {}

  /**
   * Get current merchant profile
   */
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return await this.merchantsService.findOne(req.user.merchantId)
  }

  /**
   * Get merchant integrations
   */
  @Get('integrations')
  async getIntegrations(@Request() req: AuthenticatedRequest) {
    return await this.merchantsService.getIntegrations(req.user.merchantId)
  }

  /**
   * Get specific merchant (admin only - TODO: add admin guard)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.merchantsService.findOne(id)
  }

  /**
   * Get product ladder configuration
   */
  @Get('product-ladder')
  async getProductLadder(@Request() req: AuthenticatedRequest) {
    return await this.productLadderService.getLadder(req.user.merchantId)
  }

  /**
   * Create or update product ladder configuration
   */
  @Put('product-ladder')
  async upsertProductLadder(
    @Request() req: AuthenticatedRequest,
    @Body() body: { steps: ProductLadderStep[] },
  ) {
    return await this.productLadderService.upsertLadder(
      req.user.merchantId,
      body.steps,
    )
  }

  /**
   * Get next step recommendation for a customer
   */
  @Get('product-ladder/next-step/:currentStep')
  async getNextStepProducts(
    @Request() req: AuthenticatedRequest,
    @Param('currentStep') currentStep: string,
  ) {
    return await this.productLadderService.getNextStepProducts(
      req.user.merchantId,
      parseInt(currentStep, 10),
    )
  }

  /**
   * Deactivate product ladder
   */
  @Post('product-ladder/deactivate')
  async deactivateProductLadder(@Request() req: AuthenticatedRequest) {
    await this.productLadderService.deactivateLadder(req.user.merchantId)
    return { success: true }
  }
}
