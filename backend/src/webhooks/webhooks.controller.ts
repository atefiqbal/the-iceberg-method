import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  BadRequestException,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { PollingService } from './polling.service'
import { DLQService } from './dlq.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { createHmac } from 'crypto'
import { ConfigService } from '@nestjs/config'
import { AuthenticatedRequest } from '../common/types/express-request.interface'

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly pollingService: PollingService,
    private readonly dlqService: DLQService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Handle Shopify order webhook
   * POST /webhooks/shopify/orders/create
   */
  @Post('shopify/orders/create')
  @HttpCode(200)
  async handleOrderCreate(
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: any,
  ) {
    // Verify HMAC
    const bodyString = JSON.stringify(body)
    if (!this.verifyShopifyHMAC(bodyString, hmac)) {
      throw new BadRequestException('Invalid HMAC signature')
    }

    this.logger.log(`Received order webhook from ${shopDomain}`)

    await this.webhooksService.handleOrderWebhook(shopDomain, body)

    return { success: true }
  }

  /**
   * Handle Shopify customer webhook
   * POST /webhooks/shopify/customers/create
   * POST /webhooks/shopify/customers/update
   */
  @Post('shopify/customers/:action')
  @HttpCode(200)
  async handleCustomerWebhook(
    @Param('action') action: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: any,
  ) {
    // Verify HMAC
    const bodyString = JSON.stringify(body)
    if (!this.verifyShopifyHMAC(bodyString, hmac)) {
      throw new BadRequestException('Invalid HMAC signature')
    }

    await this.webhooksService.handleCustomerWebhook(shopDomain, body, action)

    return { success: true }
  }

  /**
   * Trigger manual reconciliation
   * POST /webhooks/reconcile
   */
  @Post('reconcile')
  @UseGuards(JwtAuthGuard)
  async triggerReconciliation(@Request() req: AuthenticatedRequest) {
    const result = await this.pollingService.reconcileMerchantOrders(
      req.user.merchantId,
    )

    return {
      success: true,
      result,
    }
  }

  /**
   * Get webhook processing stats
   * GET /webhooks/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getWebhookStats(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.webhooksService.getProcessingStats(
      req.user.merchantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    return stats
  }

  /**
   * Get DLQ stats
   * GET /webhooks/dlq/stats
   */
  @Get('dlq/stats')
  @UseGuards(JwtAuthGuard)
  async getDLQStats(@Request() req: AuthenticatedRequest) {
    const stats = await this.dlqService.getStats(req.user.merchantId)
    return stats
  }

  /**
   * Get DLQ entries
   * GET /webhooks/dlq
   */
  @Get('dlq')
  @UseGuards(JwtAuthGuard)
  async getDLQEntries(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const entries = await this.dlqService.getEntries(
      req.user.merchantId,
      status,
      limit ? parseInt(limit, 10) : 50,
    )
    return entries
  }

  /**
   * Retry a failed webhook
   * POST /webhooks/dlq/:id/retry
   */
  @Post('dlq/:id/retry')
  async retryWebhook(@Param('id') id: string) {
    await this.dlqService.retryWebhook(id)
    return { success: true }
  }

  /**
   * Mark a webhook as resolved
   * PATCH /webhooks/dlq/:id/resolve
   */
  @Patch('dlq/:id/resolve')
  async resolveWebhook(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    await this.dlqService.markResolved(id, req.user.merchantId, body.notes)
    return { success: true }
  }

  /**
   * Mark a webhook as ignored
   * PATCH /webhooks/dlq/:id/ignore
   */
  @Patch('dlq/:id/ignore')
  async ignoreWebhook(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    await this.dlqService.markIgnored(id, req.user.merchantId, body.reason)
    return { success: true }
  }

  /**
   * Verify Shopify HMAC signature
   * https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook
   */
  private verifyShopifyHMAC(body: string, hmac: string): boolean {
    const secret = this.configService.get('SHOPIFY_API_SECRET')
    if (!secret) {
      this.logger.error('SHOPIFY_API_SECRET not configured')
      return false
    }

    const hash = createHmac('sha256', secret).update(body, 'utf8').digest('base64')
    return hash === hmac
  }
}
