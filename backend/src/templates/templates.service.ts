import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  EmailTemplate,
  TemplateType,
  EmailTemplateStep,
} from './entities/email-template.entity'

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name)

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
  ) {}

  /**
   * Initialize system templates on first run
   */
  async initializeSystemTemplates(): Promise<void> {
    const existing = await this.templateRepository.count({
      where: { isSystemTemplate: true },
    })

    if (existing > 0) {
      this.logger.log('System templates already initialized')
      return
    }

    this.logger.log('Initializing system templates...')

    const systemTemplates = this.getSystemTemplateDefinitions()

    for (const template of systemTemplates) {
      await this.templateRepository.save(template)
    }

    this.logger.log(`Initialized ${systemTemplates.length} system templates`)
  }

  /**
   * Get system template definitions (proven templates)
   */
  private getSystemTemplateDefinitions(): Partial<EmailTemplate>[] {
    return [
      // Nine-word email (win-back)
      {
        name: 'Nine-Word Email (Reactivation)',
        templateType: TemplateType.WIN_BACK,
        description:
          'Proven low-friction reactivation prompt. High response rate.',
        isSystemTemplate: true,
        proven: true,
        conversionBenchmark: 0.08, // 8% typical response rate
        steps: [
          {
            stepNumber: 1,
            delayHours: 0,
            subject: 'Quick question',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p style="font-size: 16px; color: #333;">Hey {{customer.firstName}},</p>
                <p style="font-size: 16px; color: #333;">Are you still interested in [your product category]?</p>
                <p style="font-size: 16px; color: #333;">- {{merchant.name}}</p>
              </div>
            `,
            bodyPlaintext: `Hey {{customer.firstName}},

Are you still interested in [your product category]?

- {{merchant.name}}`,
            variables: ['customer.firstName', 'merchant.name'],
          },
        ],
      },

      // Abandoned cart 3-step sequence
      {
        name: 'Abandoned Cart (3-Step Sequence)',
        templateType: TemplateType.ABANDONED_CART,
        description: 'Standard high-converting cart recovery sequence.',
        isSystemTemplate: true,
        proven: true,
        conversionBenchmark: 0.15, // 15% cart recovery rate
        steps: [
          {
            stepNumber: 1,
            delayHours: 1,
            subject: 'You left something behind...',
            preheader: 'Your cart is waiting for you',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hi {{customer.firstName}},</h2>
                <p style="font-size: 16px; color: #555;">
                  You left some items in your cart. We saved them for you!
                </p>
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <p style="margin: 0; color: #333;"><strong>Cart Total:</strong> {{cart.total}}</p>
                </div>
                <a href="{{cart.checkoutUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Complete Your Purchase
                </a>
                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                  Questions? Just reply to this email.
                </p>
              </div>
            `,
            bodyPlaintext: `Hi {{customer.firstName}},

You left some items in your cart. We saved them for you!

Cart Total: {{cart.total}}

Complete your purchase here: {{cart.checkoutUrl}}

Questions? Just reply to this email.`,
            variables: [
              'customer.firstName',
              'cart.total',
              'cart.checkoutUrl',
            ],
          },
          {
            stepNumber: 2,
            delayHours: 24,
            subject: 'Still thinking about it?',
            preheader: "We're here to help",
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Still on the fence?</h2>
                <p style="font-size: 16px; color: #555;">
                  We get it. Making the right choice matters.
                </p>
                <p style="font-size: 16px; color: #555;">
                  Your cart is still waiting: <a href="{{cart.checkoutUrl}}">Complete checkout</a>
                </p>
                <p style="font-size: 16px; color: #555;">
                  Have questions? Hit reply and we'll help you decide.
                </p>
              </div>
            `,
            bodyPlaintext: `Still on the fence?

We get it. Making the right choice matters.

Your cart is still waiting: {{cart.checkoutUrl}}

Have questions? Hit reply and we'll help you decide.`,
            variables: ['cart.checkoutUrl'],
          },
          {
            stepNumber: 3,
            delayHours: 72,
            subject: 'Last chance: Your cart expires soon',
            preheader: "Don't miss out",
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d9534f;">⏰ Cart Expiring Soon</h2>
                <p style="font-size: 16px; color: #555;">
                  Your saved cart will expire in 24 hours. Don't miss out!
                </p>
                <a href="{{cart.checkoutUrl}}" style="display: inline-block; background: #d9534f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Checkout Now
                </a>
              </div>
            `,
            bodyPlaintext: `⏰ Cart Expiring Soon

Your saved cart will expire in 24 hours. Don't miss out!

Checkout now: {{cart.checkoutUrl}}`,
            variables: ['cart.checkoutUrl'],
          },
        ],
      },

      // Post-purchase education
      {
        name: 'Post-Purchase Education (2-Step)',
        templateType: TemplateType.POST_PURCHASE,
        description:
          'Onboard new customers and drive second purchase.',
        isSystemTemplate: true,
        proven: true,
        conversionBenchmark: 0.12, // 12% repeat purchase rate
        steps: [
          {
            stepNumber: 1,
            delayHours: 24,
            subject: "Welcome to the family! Here's what's next",
            preheader: 'Get the most out of your purchase',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Thanks for your order, {{customer.firstName}}! 🎉</h2>
                <p style="font-size: 16px; color: #555;">
                  Your order is on its way. While you wait, here's how to get the best results:
                </p>
                <ol style="font-size: 16px; color: #555; line-height: 1.8;">
                  <li>[Product usage tip #1]</li>
                  <li>[Product usage tip #2]</li>
                  <li>[Product usage tip #3]</li>
                </ol>
                <p style="font-size: 16px; color: #555;">
                  Questions? Reply anytime.
                </p>
              </div>
            `,
            bodyPlaintext: `Thanks for your order, {{customer.firstName}}! 🎉

Your order is on its way. While you wait, here's how to get the best results:

1. [Product usage tip #1]
2. [Product usage tip #2]
3. [Product usage tip #3]

Questions? Reply anytime.`,
            variables: ['customer.firstName'],
          },
          {
            stepNumber: 2,
            delayHours: 168, // 7 days
            subject: 'Ready for the next step?',
            preheader: 'Upgrade your results',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">How's it going, {{customer.firstName}}?</h2>
                <p style="font-size: 16px; color: #555;">
                  You've had a week with [product name]. Seeing results?
                </p>
                <p style="font-size: 16px; color: #555;">
                  Most customers who love [product] upgrade to [next product] for even better results.
                </p>
                <a href="{{merchant.storeUrl}}/products/{{nextProduct.handle}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Explore [Next Product]
                </a>
              </div>
            `,
            bodyPlaintext: `How's it going, {{customer.firstName}}?

You've had a week with [product name]. Seeing results?

Most customers who love [product] upgrade to [next product] for even better results.

Explore here: {{merchant.storeUrl}}/products/{{nextProduct.handle}}`,
            variables: [
              'customer.firstName',
              'merchant.storeUrl',
              'nextProduct.handle',
            ],
          },
        ],
      },

      // Welcome series
      {
        name: 'Welcome Series (3-Step)',
        templateType: TemplateType.WELCOME,
        description: 'Convert subscribers to first-time buyers.',
        isSystemTemplate: true,
        proven: true,
        conversionBenchmark: 0.05, // 5% conversion to first purchase
        steps: [
          {
            stepNumber: 1,
            delayHours: 0,
            subject: "Welcome! Here's your exclusive offer",
            preheader: '10% off your first order',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to {{merchant.name}}! 👋</h2>
                <p style="font-size: 16px; color: #555;">
                  Thanks for joining us. Here's 10% off your first order:
                </p>
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">
                    {{welcome.promoCode}}
                  </p>
                  <p style="margin: 10px 0 0 0; color: #777; font-size: 14px;">
                    Use at checkout
                  </p>
                </div>
                <a href="{{merchant.storeUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Start Shopping
                </a>
              </div>
            `,
            bodyPlaintext: `Welcome to {{merchant.name}}! 👋

Thanks for joining us. Here's 10% off your first order:

Code: {{welcome.promoCode}}

Start shopping: {{merchant.storeUrl}}`,
            variables: ['merchant.name', 'welcome.promoCode', 'merchant.storeUrl'],
          },
          {
            stepNumber: 2,
            delayHours: 48,
            subject: 'Our best sellers (handpicked for you)',
            preheader: 'See what everyone loves',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Not sure where to start?</h2>
                <p style="font-size: 16px; color: #555;">
                  These are our customers' favorites:
                </p>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 20px 0;">[Product 1 with image and link]</li>
                  <li style="margin: 20px 0;">[Product 2 with image and link]</li>
                  <li style="margin: 20px 0;">[Product 3 with image and link]</li>
                </ul>
                <p style="font-size: 14px; color: #777;">
                  Remember: Your 10% code {{welcome.promoCode}} is still active!
                </p>
              </div>
            `,
            bodyPlaintext: `Not sure where to start?

These are our customers' favorites:

- [Product 1]
- [Product 2]
- [Product 3]

Remember: Your 10% code {{welcome.promoCode}} is still active!`,
            variables: ['welcome.promoCode'],
          },
          {
            stepNumber: 3,
            delayHours: 120, // 5 days
            subject: 'Your code expires tonight',
            preheader: 'Last chance for 10% off',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d9534f;">⏰ Expires Tonight</h2>
                <p style="font-size: 16px; color: #555;">
                  Your welcome code {{welcome.promoCode}} expires at midnight.
                </p>
                <a href="{{merchant.storeUrl}}" style="display: inline-block; background: #d9534f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Use Code Now
                </a>
              </div>
            `,
            bodyPlaintext: `⏰ Expires Tonight

Your welcome code {{welcome.promoCode}} expires at midnight.

Shop now: {{merchant.storeUrl}}`,
            variables: ['welcome.promoCode', 'merchant.storeUrl'],
          },
        ],
      },

      // Abandoned checkout (higher intent than cart)
      {
        name: 'Abandoned Checkout (2-Step)',
        templateType: TemplateType.ABANDONED_CHECKOUT,
        description: 'Recover high-intent checkout abandoners.',
        isSystemTemplate: true,
        proven: true,
        conversionBenchmark: 0.25, // 25% recovery rate
        steps: [
          {
            stepNumber: 1,
            delayHours: 0.5, // 30 minutes
            subject: 'Complete your order (one click away)',
            preheader: 'Your order is almost complete',
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">You're so close! ✨</h2>
                <p style="font-size: 16px; color: #555;">
                  Your order is ready - just one click to complete:
                </p>
                <a href="{{checkout.url}}" style="display: inline-block; background: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-size: 18px;">
                  Complete Order → {{checkout.total}}
                </a>
                <p style="font-size: 14px; color: #777;">
                  Secure checkout • Free shipping over $50
                </p>
              </div>
            `,
            bodyPlaintext: `You're so close! ✨

Your order is ready - just one click to complete:

{{checkout.url}}

Total: {{checkout.total}}

Secure checkout • Free shipping over $50`,
            variables: ['checkout.url', 'checkout.total'],
          },
          {
            stepNumber: 2,
            delayHours: 24,
            subject: 'Need help checking out?',
            preheader: "We're here to help",
            bodyHtml: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Having trouble?</h2>
                <p style="font-size: 16px; color: #555;">
                  We noticed you didn't complete your order. Need help?
                </p>
                <ul style="font-size: 16px; color: #555;">
                  <li>Payment issue? We accept all major cards.</li>
                  <li>Shipping question? Reply and we'll answer.</li>
                  <li>Changed your mind? Let us know what we can improve.</li>
                </ul>
                <a href="{{checkout.url}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                  Try Again
                </a>
              </div>
            `,
            bodyPlaintext: `Having trouble?

We noticed you didn't complete your order. Need help?

- Payment issue? We accept all major cards.
- Shipping question? Reply and we'll answer.
- Changed your mind? Let us know what we can improve.

Try again: {{checkout.url}}`,
            variables: ['checkout.url'],
          },
        ],
      },
    ]
  }

  /**
   * Get all system templates
   */
  async getSystemTemplates(): Promise<EmailTemplate[]> {
    return await this.templateRepository.find({
      where: { isSystemTemplate: true },
      order: { templateType: 'ASC', name: 'ASC' },
    })
  }

  /**
   * Get merchant's customized templates
   */
  async getMerchantTemplates(merchantId: string): Promise<EmailTemplate[]> {
    return await this.templateRepository.find({
      where: { merchantId, isSystemTemplate: false },
      order: { templateType: 'ASC', name: 'ASC' },
    })
  }

  /**
   * Customize a system template for a merchant
   */
  async customizeTemplate(
    merchantId: string,
    systemTemplateId: string,
    customizations: {
      name?: string
      steps?: EmailTemplateStep[]
    },
  ): Promise<EmailTemplate> {
    const systemTemplate = await this.templateRepository.findOne({
      where: { id: systemTemplateId, isSystemTemplate: true },
    })

    if (!systemTemplate) {
      throw new NotFoundException('System template not found')
    }

    // Create merchant's custom version
    const customTemplate = this.templateRepository.create({
      merchantId,
      name: customizations.name || `${systemTemplate.name} (Custom)`,
      templateType: systemTemplate.templateType,
      description: systemTemplate.description,
      steps: customizations.steps || systemTemplate.steps,
      isSystemTemplate: false,
      proven: false,
      basedOnTemplateId: systemTemplateId,
      active: true,
    })

    const saved = await this.templateRepository.save(customTemplate)

    this.logger.log(
      `Merchant ${merchantId} customized template ${systemTemplateId}`,
    )

    return saved
  }

  /**
   * Update merchant's custom template
   */
  async updateTemplate(
    templateId: string,
    merchantId: string,
    updates: {
      name?: string
      steps?: EmailTemplateStep[]
      active?: boolean
    },
  ): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, merchantId },
    })

    if (!template) {
      throw new NotFoundException('Template not found')
    }

    if (template.isSystemTemplate) {
      throw new Error('Cannot modify system templates')
    }

    if (updates.name) template.name = updates.name
    if (updates.steps) template.steps = updates.steps
    if (updates.active !== undefined) template.active = updates.active

    return await this.templateRepository.save(template)
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    })

    if (!template) {
      throw new NotFoundException('Template not found')
    }

    return template
  }

  /**
   * Get active template for a flow type (merchant's custom or system default)
   */
  async getActiveTemplateForFlow(
    merchantId: string,
    templateType: TemplateType,
  ): Promise<EmailTemplate> {
    // Try merchant's custom template first
    const merchantTemplate = await this.templateRepository.findOne({
      where: {
        merchantId,
        templateType,
        active: true,
        isSystemTemplate: false,
      },
    })

    if (merchantTemplate) {
      return merchantTemplate
    }

    // Fall back to system template
    const systemTemplate = await this.templateRepository.findOne({
      where: {
        templateType,
        isSystemTemplate: true,
        proven: true,
      },
    })

    if (!systemTemplate) {
      throw new NotFoundException(
        `No template found for flow type: ${templateType}`,
      )
    }

    return systemTemplate
  }
}
