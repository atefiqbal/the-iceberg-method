import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ShopifyService } from './shopify.service'
import { MerchantIntegration } from '../merchants/entities/merchant-integration.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MerchantIntegration])],
  providers: [ShopifyService],
  exports: [ShopifyService],
})
export class ShopifyModule {}
