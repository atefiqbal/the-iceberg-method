import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CROService } from './cro.service'
import { CROController } from './cro.controller'
import { CROInsight } from './entities/cro-insight.entity'
import { MerchantsModule } from '../merchants/merchants.module'

@Module({
  imports: [TypeOrmModule.forFeature([CROInsight]), MerchantsModule],
  controllers: [CROController],
  providers: [CROService],
  exports: [CROService],
})
export class CROModule {}
