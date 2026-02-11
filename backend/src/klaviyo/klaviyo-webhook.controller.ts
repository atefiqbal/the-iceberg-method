import { Controller, Post, Body, Headers, Logger } from '@nestjs/common'

/**
 * Handles webhooks from Klaviyo for email events
 * Tracks opens, clicks, bounces for journey analytics
 */
@Controller('webhooks/klaviyo')
export class KlaviyoWebhookController {
  private readonly logger = new Logger(KlaviyoWebhookController.name)
  /**
   * Handle Klaviyo email event webhooks
   * Events: opened, clicked, bounced, etc.
   */
  @Post()
  async handleKlaviyoWebhook(
    @Body() payload: any,
    @Headers('x-klaviyo-signature') signature: string,
  ) {
    this.logger.log(`Received Klaviyo webhook: ${payload.type}`)
    try {
      // TODO: Verify webhook signature for security
      // const isValid = this.verifySignature(payload, signature)
      // if (!isValid) {
      //   return { status: 'invalid_signature' }
      // }
      const eventType = payload.type
      const eventData = payload.data?.attributes || {}
      switch (eventType) {
        case 'email.opened':
          await this.handleEmailOpened(eventData)
          break
        case 'email.clicked':
          await this.handleEmailClicked(eventData)
          break
        case 'email.bounced':
          await this.handleEmailBounced(eventData)
          break
        case 'email.marked_as_spam':
          await this.handleEmailMarkedAsSpam(eventData)
          break
        default:
          this.logger.debug(`Unhandled Klaviyo event type: ${eventType}`)
      }
      return { status: 'success' }
    } catch (error) {
      this.logger.error(
        `Failed to process Klaviyo webhook: ${error.message}`,
        error.stack,
      )
      // Return 200 to prevent Klaviyo from retrying
      // We'll handle errors internally
      return { status: 'error', message: error.message }
    }
  }

  /**
   * Handle email opened event
   */
  private async handleEmailOpened(eventData: any) {
    const email = eventData.profile?.email
    const flowId = eventData.flow_id
    const campaignId = eventData.campaign_id

    if (!email) {
      this.logger.warn('Email opened event missing email address')
      return
    }

    // For flow emails, track journey event
    if (flowId) {
      // TODO: Look up customer by email and merchant
      // For now, we'll log the event
      this.logger.log(`Flow email opened by ${email} (flow: ${flowId})`)
      // In production, you'd:
      // 1. Look up customer by email
      // 2. Get their current journey
      // 3. Log FLOW_EMAIL_OPENED event
    }
  }

  /**
   * Handle email clicked event
   */
  private async handleEmailClicked(eventData: any) {
    const email = eventData.profile?.email
    const flowId = eventData.flow_id
    const url = eventData.url

    if (!email) {
      this.logger.warn('Email clicked event missing email address')
      return
    }

    this.logger.log(
      `Flow email clicked by ${email} (flow: ${flowId}, url: ${url})`,
    )
    // In production, track FLOW_EMAIL_CLICKED event
  }

  /**
   * Handle email bounced event
   */
  private async handleEmailBounced(eventData: any) {
    const email = eventData.profile?.email
    const bounceType = eventData.bounce_type // hard or soft

    if (!email) {
      this.logger.warn('Email bounced event missing email address')
      return
    }

    this.logger.warn(`Email bounced for ${email} (type: ${bounceType})`)
    // TODO: Update customer profile or suppress future emails
  }

  /**
   * Handle email marked as spam
   */
  private async handleEmailMarkedAsSpam(eventData: any) {
    const email = eventData.profile?.email

    if (!email) {
      this.logger.warn('Email spam event missing email address')
      return
    }

    this.logger.warn(`Email marked as spam by ${email}`)
    // TODO: Immediately suppress this customer from all flows
  }
}
