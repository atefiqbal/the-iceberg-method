import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  PhaseCompletion,
  PhaseType,
  PhaseStatus,
} from './entities/phase-completion.entity'

export interface PhaseInfo {
  phase: PhaseType
  status: PhaseStatus
  name: string
  description: string
  completedAt?: Date
  unlocked: boolean
}

@Injectable()
export class PhasesService {
  private readonly logger = new Logger(PhasesService.name)

  // Phase order from SPEC.md section 6.3
  private readonly phaseOrder: PhaseType[] = [
    PhaseType.DELIVERABILITY,
    PhaseType.CORE_FLOWS,
    PhaseType.SEGMENTATION,
    PhaseType.CONVERSION_MEASUREMENT,
    PhaseType.CRO_OBSERVATION,
    PhaseType.REVENUE_ACTIVATION,
    PhaseType.OFFER_CONSTRUCTION,
    PhaseType.PAID_ACQUISITION,
  ]

  private readonly phaseMetadata: Record<
    PhaseType,
    { name: string; description: string }
  > = {
    [PhaseType.DELIVERABILITY]: {
      name: 'Deliverability',
      description: 'Monitor sender reputation and email deliverability',
    },
    [PhaseType.CORE_FLOWS]: {
      name: 'Core Flows',
      description: 'Set up lifecycle email automation flows',
    },
    [PhaseType.SEGMENTATION]: {
      name: 'Segmentation',
      description: 'Configure customer segments and product ladder',
    },
    [PhaseType.CONVERSION_MEASUREMENT]: {
      name: 'Conversion Measurement',
      description: 'Track email attribution and calculate RPR',
    },
    [PhaseType.CRO_OBSERVATION]: {
      name: 'CRO Observation',
      description: 'Identify funnel friction points and optimization opportunities',
    },
    [PhaseType.REVENUE_ACTIVATION]: {
      name: 'Revenue Activation',
      description: 'Activate dormant lifecycle revenue opportunities',
    },
    [PhaseType.OFFER_CONSTRUCTION]: {
      name: 'Offer Construction',
      description: 'Build margin-conscious promotional campaigns',
    },
    [PhaseType.PAID_ACQUISITION]: {
      name: 'Paid Acquisition',
      description: 'Scale with confidence once all gates pass',
    },
  }

  constructor(
    @InjectRepository(PhaseCompletion)
    private phaseCompletionRepository: Repository<PhaseCompletion>,
  ) {}

  /**
   * Get all phases with their status for a merchant
   * Implements progressive disclosure from SPEC.md section 6.3
   */
  async getAllPhases(merchantId: string): Promise<PhaseInfo[]> {
    const completions = await this.phaseCompletionRepository.find({
      where: { merchantId },
    })

    const completionMap = new Map<PhaseType, PhaseCompletion>()
    completions.forEach((c) => completionMap.set(c.phase, c))

    // Find first incomplete phase
    let currentPhaseIndex = 0
    for (let i = 0; i < this.phaseOrder.length; i++) {
      const phase = this.phaseOrder[i]
      const completion = completionMap.get(phase)
      if (!completion || completion.status !== PhaseStatus.COMPLETED) {
        currentPhaseIndex = i
        break
      }
      if (i === this.phaseOrder.length - 1) {
        // All phases completed
        currentPhaseIndex = this.phaseOrder.length
      }
    }

    return this.phaseOrder.map((phase, index) => {
      const completion = completionMap.get(phase)
      const metadata = this.phaseMetadata[phase]

      let status: PhaseStatus
      let unlocked: boolean

      if (index < currentPhaseIndex) {
        // Previous phases are completed
        status = PhaseStatus.COMPLETED
        unlocked = true
      } else if (index === currentPhaseIndex) {
        // Current phase
        status = PhaseStatus.CURRENT
        unlocked = true
      } else {
        // Future phases are locked
        status = PhaseStatus.LOCKED
        unlocked = false
      }

      return {
        phase,
        status,
        name: metadata.name,
        description: metadata.description,
        completedAt: completion?.completedAt,
        unlocked,
      }
    })
  }

  /**
   * Get current phase for merchant
   */
  async getCurrentPhase(merchantId: string): Promise<PhaseType | null> {
    const phases = await this.getAllPhases(merchantId)
    const currentPhase = phases.find((p) => p.status === PhaseStatus.CURRENT)
    return currentPhase?.phase || null
  }

  /**
   * Mark a phase as completed
   */
  async completePhase(
    merchantId: string,
    phase: PhaseType,
    metadata?: Record<string, any>,
  ): Promise<void> {
    let completion = await this.phaseCompletionRepository.findOne({
      where: { merchantId, phase },
    })

    if (completion) {
      completion.status = PhaseStatus.COMPLETED
      completion.completedAt = new Date()
      if (metadata) {
        completion.metadata = metadata
      }
    } else {
      completion = this.phaseCompletionRepository.create({
        merchantId,
        phase,
        status: PhaseStatus.COMPLETED,
        completedAt: new Date(),
        metadata,
      })
    }

    await this.phaseCompletionRepository.save(completion)

    this.logger.log(`Phase completed: ${phase} for merchant ${merchantId}`)
  }

  /**
   * Initialize phases for new merchant
   * Phase 1 (Deliverability) is unlocked by default
   */
  async initializePhases(merchantId: string): Promise<void> {
    // Create Phase 1 as current
    await this.phaseCompletionRepository.save({
      merchantId,
      phase: PhaseType.DELIVERABILITY,
      status: PhaseStatus.CURRENT,
    })

    this.logger.log(`Phases initialized for merchant ${merchantId}`)
  }

  /**
   * Check if a phase is unlocked (current or completed)
   */
  async isPhaseUnlocked(
    merchantId: string,
    phase: PhaseType,
  ): Promise<boolean> {
    const phases = await this.getAllPhases(merchantId)
    const phaseInfo = phases.find((p) => p.phase === phase)
    return phaseInfo?.unlocked || false
  }

  /**
   * Get completed phases
   */
  async getCompletedPhases(merchantId: string): Promise<PhaseType[]> {
    const completions = await this.phaseCompletionRepository.find({
      where: { merchantId, status: PhaseStatus.COMPLETED },
    })
    return completions.map((c) => c.phase)
  }
}
