import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CampaignsService } from './campaigns.service'
import { CampaignsController } from './campaigns.controller'
import { Campaign } from './entities/campaign.entity'
import { GatesModule } from '../gates/gates.module'
import { KlaviyoModule } from '../klaviyo/klaviyo.module'
import { CustomersModule } from '../customers/customers.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    GatesModule,
    KlaviyoModule,
    CustomersModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
