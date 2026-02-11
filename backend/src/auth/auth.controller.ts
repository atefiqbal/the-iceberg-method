import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import {
  ShopifyOAuthCallbackDto,
  ShopifyOAuthInitDto,
} from './dto/shopify-oauth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * Initiate Shopify OAuth flow
   * POST /auth/shopify/install
   * Rate limit: 10 requests per minute
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('shopify/install')
  async initiateShopifyOAuth(@Body() dto: ShopifyOAuthInitDto) {
    const { authUrl, state } = this.authService.generateShopifyAuthUrl(dto.shop)
    return {
      authUrl,
      shop: dto.shop,
      state,
    }
  }
  /**
   * Handle Shopify OAuth callback
   * POST /auth/shopify/callback
   */
  @Post('shopify/callback')
  async handleShopifyCallback(@Body() dto: ShopifyOAuthCallbackDto) {
    // TODO: Verify state parameter for CSRF protection
    // In production, store state in Redis and validate here
    const result = await this.authService.completeShopifyOAuth(
      dto.code,
      dto.shop,
    )
    return {
      success: true,
      merchant: result.merchant,
      token: result.token,
    }
  }
  /**
   * Get current user from JWT
   * GET /auth/me
   */
  @Get('me')
  async getCurrentUser(@Query('token') token: string) {
    const payload = await this.authService.validateToken(token)
    return { merchantId: payload.merchantId }
  }

  /**
   * Development-only endpoint to get a test JWT token
   * GET /auth/dev-token
   *
   * IMPORTANT: Only works when NODE_ENV !== 'production'
   * Returns a valid JWT for the test merchant from seed script
   */
  @Get('dev-token')
  async getDevToken() {
    if (process.env.NODE_ENV === 'production') {
      return {
        error: 'Dev tokens not available in production',
        status: 403,
      }
    }

    try {
      const result = await this.authService.generateDevToken()

      return {
        accessToken: result.accessToken,
        merchantId: result.merchantId,
        expiresIn: '7d',
        message:
          'Development token generated. Frontend will use this automatically.',
      }
    } catch (error) {
      return {
        error: error.message,
        hint: 'Run: npx ts-node scripts/seed-test-data.ts',
      }
    }
  }
}
