import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrdersService } from './orders.service'
import { AttributionService } from './attribution.service'
import { AttributionController } from './attribution.controller'
import { Order } from './entities/order.entity'
import { CustomersModule } from '../customers/customers.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    forwardRef(() => CustomersModule),
  ],
  controllers: [AttributionController],
  providers: [OrdersService, AttributionService],
  exports: [OrdersService, AttributionService],
})
export class OrdersModule {}
