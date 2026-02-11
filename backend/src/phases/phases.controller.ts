import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { PhasesService } from './phases.service'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PhaseType } from './entities/phase-completion.entity'

@Controller('phases')
@UseGuards(JwtAuthGuard)
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  /**
   * Get all phases with their status
   * GET /phases
   */
  @Get()
  async getAllPhases(@Request() req: AuthenticatedRequest) {
    return await this.phasesService.getAllPhases(req.user.merchantId)
  }

  /**
   * Get current phase
   * GET /phases/current
   */
  @Get('current')
  async getCurrentPhase(@Request() req: AuthenticatedRequest) {
    const currentPhase = await this.phasesService.getCurrentPhase(
      req.user.merchantId,
    )
    return { currentPhase }
  }

  /**
   * Get completed phases
   * GET /phases/completed
   */
  @Get('completed')
  async getCompletedPhases(@Request() req: AuthenticatedRequest) {
    const completed = await this.phasesService.getCompletedPhases(
      req.user.merchantId,
    )
    return { completed }
  }

  /**
   * Mark a phase as completed
   * POST /phases/:phase/complete
   */
  @Post(':phase/complete')
  async completePhase(
    @Request() req: AuthenticatedRequest,
    @Param('phase') phase: PhaseType,
    @Body() body: { metadata?: Record<string, any> },
  ) {
    await this.phasesService.completePhase(
      req.user.merchantId,
      phase,
      body.metadata,
    )
    return {
      success: true,
      message: `Phase ${phase} marked as completed`,
    }
  }

  /**
   * Check if phase is unlocked
   * GET /phases/:phase/unlocked
   */
  @Get(':phase/unlocked')
  async isPhaseUnlocked(
    @Request() req: AuthenticatedRequest,
    @Param('phase') phase: PhaseType,
  ) {
    const unlocked = await this.phasesService.isPhaseUnlocked(
      req.user.merchantId,
      phase,
    )
    return { unlocked }
  }

  /**
   * Initialize phases for merchant (called during onboarding)
   * POST /phases/initialize
   */
  @Post('initialize')
  async initializePhases(@Request() req: AuthenticatedRequest) {
    await this.phasesService.initializePhases(req.user.merchantId)
    return {
      success: true,
      message: 'Phases initialized',
    }
  }
}
