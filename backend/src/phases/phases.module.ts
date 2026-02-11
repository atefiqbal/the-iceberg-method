import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PhasesService } from './phases.service'
import { PhasesController } from './phases.controller'
import { PhaseCompletion } from './entities/phase-completion.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PhaseCompletion])],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
