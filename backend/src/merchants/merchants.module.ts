import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MerchantsService } from './merchants.service'
import { MerchantsController } from './merchants.controller'
import { ProductLadderService } from './product-ladder.service'
import { Merchant } from './entities/merchant.entity'
import { MerchantIntegration } from './entities/merchant-integration.entity'
import { ProductLadder } from './entities/product-ladder.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Merchant, MerchantIntegration, ProductLadder])],
  controllers: [MerchantsController],
  providers: [MerchantsService, ProductLadderService],
  exports: [MerchantsService, ProductLadderService],
})
export class MerchantsModule {}
