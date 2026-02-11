import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common'
import { KlaviyoService } from './klaviyo.service'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('klaviyo')
@UseGuards(JwtAuthGuard)
export class KlaviyoController {
  constructor(private readonly klaviyoService: KlaviyoService) {}
  /**
   * Connect Klaviyo integration
   */
  @Post('connect')
  async connect(@Request() req: AuthenticatedRequest, @Body() body: { apiKey: string }) {
    await this.klaviyoService.connect(req.user.merchantId, body.apiKey)
    return {
      success: true,
      message: 'Klaviyo connected successfully',
    }
  }

  /**
   * Disconnect Klaviyo integration
   */
  @Delete('disconnect')
  async disconnect(@Request() req: AuthenticatedRequest) {
    await this.klaviyoService.disconnect(req.user.merchantId)
    return {
      success: true,
      message: 'Klaviyo disconnected',
    }
  }

  /**
   * Get integration status
   */
  @Get('status')
  async getStatus(@Request() req: AuthenticatedRequest) {
    return await this.klaviyoService.getIntegrationStatus(req.user.merchantId)
  }

  /**
   * Fetch current deliverability metrics
   */
  @Get('metrics/deliverability')
  async getDeliverabilityMetrics(@Request() req: AuthenticatedRequest) {
    const metrics = await this.klaviyoService.fetchDeliverabilityMetrics(
      req.user.merchantId,
    )
    return {
      success: true,
      metrics,
    }
  }

  /**
   * Manually trigger deliverability sync
   */
  @Post('sync/deliverability')
  async syncDeliverability(@Request() req: AuthenticatedRequest) {
    await this.klaviyoService.syncDeliverabilityMetrics(req.user.merchantId)
    return {
      success: true,
      message: 'Deliverability metrics synced',
    }
  }
}
