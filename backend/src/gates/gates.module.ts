import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GatesService } from './gates.service'
import { GatesController } from './gates.controller'
import { GateState } from './entities/gate-state.entity'
import { GateOverride } from './entities/gate-override.entity'

@Module({
  imports: [TypeOrmModule.forFeature([GateState, GateOverride])],
  controllers: [GatesController],
  providers: [GatesService],
  exports: [GatesService],
})
export class GatesModule {}
