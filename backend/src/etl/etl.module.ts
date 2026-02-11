import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { ETLService } from './etl.service'
import { ETLController } from './etl.controller'
import { Merchant } from '../merchants/entities/merchant.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    ScheduleModule.forRoot(),
  ],
  controllers: [ETLController],
  providers: [ETLService],
  exports: [ETLService],
})
export class ETLModule {}
