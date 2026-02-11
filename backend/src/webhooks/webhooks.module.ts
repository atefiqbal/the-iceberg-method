import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { PollingService } from './polling.service'
import { DLQService } from './dlq.service'
import { ShopifyWebhookProcessor } from './processors/shopify-webhook.processor'
import { WebhookEvent } from './entities/webhook-event.entity'
import { WebhookDLQ } from './entities/webhook-dlq.entity'
import { Merchant } from '../merchants/entities/merchant.entity'
import { Order } from '../orders/entities/order.entity'
import { OrdersModule } from '../orders/orders.module'
import { CustomersModule } from '../customers/customers.module'
import { MerchantsModule } from '../merchants/merchants.module'
import { JourneysModule } from '../journeys/journeys.module'
import { ShopifyModule } from '../shopify/shopify.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent, WebhookDLQ, Merchant, Order]),
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    OrdersModule,
    CustomersModule,
    MerchantsModule,
    JourneysModule,
    ShopifyModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, PollingService, DLQService, ShopifyWebhookProcessor],
  exports: [WebhooksService, PollingService, DLQService],
})
export class WebhooksModule {}
