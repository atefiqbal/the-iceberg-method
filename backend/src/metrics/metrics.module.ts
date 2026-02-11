import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'
import { Baseline } from './entities/baseline.entity'
import { Order } from '../orders/entities/order.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Baseline, Order])],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
