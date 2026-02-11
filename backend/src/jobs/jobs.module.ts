import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ScheduleModule } from '@nestjs/schedule'
import { JobsService } from './jobs.service'
import { JobsController } from './jobs.controller'
import { BaselineCalculationProcessor } from './processors/baseline-calculation.processor'
import { DataBackfillProcessor } from './processors/data-backfill.processor'
import { MetricsModule } from '../metrics/metrics.module'
import { MerchantsModule } from '../merchants/merchants.module'
import { OrdersModule } from '../orders/orders.module'
import { CustomersModule } from '../customers/customers.module'
import { KlaviyoModule } from '../klaviyo/klaviyo.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      {
        name: 'baseline-calculation',
      },
      {
        name: 'data-backfill',
      },
    ),
    MetricsModule,
    MerchantsModule,
    OrdersModule,
    CustomersModule,
    KlaviyoModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, BaselineCalculationProcessor, DataBackfillProcessor],
  exports: [JobsService],
})
export class JobsModule {}
