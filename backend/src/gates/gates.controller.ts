import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common'
import { GatesService } from './gates.service'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { GateType } from './entities/gate-state.entity'

@Controller('gates')
@UseGuards(JwtAuthGuard)
export class GatesController {
  constructor(private readonly gatesService: GatesService) {}
  /**
   * Get all gates for current merchant
   */
  @Get()
  async getAllGates(@Request() req: AuthenticatedRequest) {
    return await this.gatesService.getAllGates(req.user.merchantId)
  }

  /**
   * Get specific gate status
   */
  @Get(':gateType')
  async getGate(@Request() req: AuthenticatedRequest, @Param('gateType') gateType: GateType) {
    return await this.gatesService.getGateState(req.user.merchantId, gateType)
  }

  /**
   * Check if feature is blocked
   */
  @Get('check/:feature')
  async checkFeature(@Request() req: AuthenticatedRequest, @Param('feature') feature: string) {
    const result = await this.gatesService.isFeatureBlocked(
      req.user.merchantId,
      feature,
    )
    if (result.blocked) {
      throw new ForbiddenException({
        message: result.reason,
        gate: result.gate,
        canOverride: true,
      })
    }
    return { allowed: true }
  }

  /**
   * Override gate (with reason)
   */
  @Post('override/:gateType')
  async overrideGate(
    @Request() req: AuthenticatedRequest,
    @Param('gateType') gateType: GateType,
    @Body() body: { reason: string },
  ) {
    await this.gatesService.logGateOverride(
      req.user.merchantId,
      gateType,
      req.user.merchantId, // TODO: Use actual user ID when user table exists
      body.reason,
    )
    return {
      success: true,
      message: 'Gate override logged. Proceed with caution.',
    }
  }
}
