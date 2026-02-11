import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BackfillService } from './backfill.service'
import { BackfillController } from './backfill.controller'
import { BackfillJob } from './entities/backfill-job.entity'
import { ShopifyModule } from '../shopify/shopify.module'
import { OrdersModule } from '../orders/orders.module'
import { CustomersModule } from '../customers/customers.module'
import { JourneysModule } from '../journeys/journeys.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([BackfillJob]),
    ShopifyModule,
    OrdersModule,
    CustomersModule,
    JourneysModule,
  ],
  controllers: [BackfillController],
  providers: [BackfillService],
  exports: [BackfillService],
})
export class BackfillModule {}
