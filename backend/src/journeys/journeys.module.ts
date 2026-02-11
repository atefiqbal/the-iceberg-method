import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JourneysService } from './journeys.service'
import { JourneysController } from './journeys.controller'
import { CustomerJourney } from './entities/customer-journey.entity'
import { JourneyEvent } from './entities/journey-event.entity'
import { CustomersModule } from '../customers/customers.module'
import { OrdersModule } from '../orders/orders.module'
import { KlaviyoModule } from '../klaviyo/klaviyo.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerJourney, JourneyEvent]),
    CustomersModule,
    OrdersModule,
    KlaviyoModule,
  ],
  controllers: [JourneysController],
  providers: [JourneysService],
  exports: [JourneysService],
})
export class JourneysModule {}
