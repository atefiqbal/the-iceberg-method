import { Module, forwardRef } from '@nestjs/common'
import { KlaviyoService } from './klaviyo.service'
import { KlaviyoSyncService } from './klaviyo-sync.service'
import { KlaviyoController } from './klaviyo.controller'
import { KlaviyoWebhookController } from './klaviyo-webhook.controller'
import { MerchantsModule } from '../merchants/merchants.module'
import { GatesModule } from '../gates/gates.module'

@Module({
  imports: [MerchantsModule, GatesModule],
  controllers: [KlaviyoController, KlaviyoWebhookController],
  providers: [KlaviyoService, KlaviyoSyncService],
  exports: [KlaviyoService],
})
export class KlaviyoModule {}
