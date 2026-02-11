import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GateState, GateType, GateStatus } from './entities/gate-state.entity'
import { GateOverride } from './entities/gate-override.entity'
import { addHours } from 'date-fns'

interface DeliverabilityMetrics {
  hardBounceRate: number
  softBounceRate: number
  spamComplaintRate: number
}

interface GateEvaluationResult {
  status: GateStatus
  message: string
  blockedFeatures: string[]
  gracePeriodEndsAt?: Date
  failedAt?: Date
  canOverride: boolean
  overrideWarning?: string
}

@Injectable()
export class GatesService {
  private readonly logger = new Logger(GatesService.name)

  constructor(
    @InjectRepository(GateState)
    private gateStateRepository: Repository<GateState>,
    @InjectRepository(GateOverride)
    private gateOverrideRepository: Repository<GateOverride>,
  ) {}

  /**
   * Evaluate deliverability gate
   * Thresholds from spec:
   * - Hard bounce ≤ 0.5%
   * - Soft bounce warning at 3%, fail at ≥5%
   * - Spam complaint ≤ 0.1%
   */
  async evaluateDeliverabilityGate(
    merchantId: string,
    metrics: DeliverabilityMetrics,
  ): Promise<GateEvaluationResult> {
    const { hardBounceRate, softBounceRate, spamComplaintRate } = metrics

    // Check thresholds
    const hardBounceFail = hardBounceRate > 0.005 // 0.5%
    const softBounceFail = softBounceRate >= 0.05 // 5%
    const softBounceWarn = softBounceRate >= 0.03 // 3%
    const spamFail = spamComplaintRate > 0.001 // 0.1%

    // Get existing gate state
    const existingGate = await this.getGateState(
      merchantId,
      GateType.DELIVERABILITY,
    )

    // Determine if gate fails
    const fails = hardBounceFail || softBounceFail || spamFail

    if (!fails) {
      // All metrics pass
      if (softBounceWarn) {
        // Warning status
        await this.updateGateState(merchantId, GateType.DELIVERABILITY, {
          status: GateStatus.WARNING,
          metrics,
        })

        return {
          status: GateStatus.WARNING,
          message: 'Soft bounce rate approaching threshold (3%)',
          blockedFeatures: [],
          canOverride: false,
        }
      }

      // Clear any existing failures
      if (existingGate) {
        await this.clearGateState(merchantId, GateType.DELIVERABILITY)
      }

      return {
        status: GateStatus.PASS,
        message: 'Deliverability healthy',
        blockedFeatures: [],
        canOverride: false,
      }
    }

    // Gate fails - check if in grace period
    if (
      !existingGate ||
      existingGate.status === GateStatus.PASS ||
      existingGate.status === GateStatus.WARNING
    ) {
      // First failure - enter 24h grace period
      const gracePeriodEndsAt = addHours(new Date(), 24)

      await this.updateGateState(merchantId, GateType.DELIVERABILITY, {
        status: GateStatus.GRACE_PERIOD,
        failedAt: new Date(),
        gracePeriodEndsAt,
        metrics,
      })

      this.logger.warn(
        `Deliverability gate entered grace period for merchant ${merchantId}`,
      )

      // TODO: Send alert notification

      return {
        status: GateStatus.GRACE_PERIOD,
        message:
          'Deliverability thresholds exceeded. Grace period: 24 hours to fix.',
        blockedFeatures: [],
        gracePeriodEndsAt,
        failedAt: new Date(),
        canOverride: false,
      }
    }

    if (existingGate.status === GateStatus.GRACE_PERIOD) {
      // Check if grace period expired
      if (new Date() > existingGate.gracePeriodEndsAt!) {
        // Grace period expired - hard fail
        await this.updateGateState(merchantId, GateType.DELIVERABILITY, {
          status: GateStatus.FAIL,
          metrics,
        })

        this.logger.error(
          `Deliverability gate FAILED for merchant ${merchantId}`,
        )

        // TODO: Send critical alert

        return {
          status: GateStatus.FAIL,
          message:
            'Deliverability gate FAILED. Promotions and campaigns blocked.',
          blockedFeatures: ['promotions', 'campaigns'],
          failedAt: existingGate.failedAt,
          canOverride: true,
          overrideWarning:
            'Sending promotions may damage sender reputation and reduce revenue.',
        }
      }

      // Still in grace period
      return {
        status: GateStatus.GRACE_PERIOD,
        message: `Grace period active. Fix deliverability before ${existingGate.gracePeriodEndsAt!.toLocaleString()}.`,
        blockedFeatures: [],
        gracePeriodEndsAt: existingGate.gracePeriodEndsAt,
        failedAt: existingGate.failedAt,
        canOverride: false,
      }
    }

    // Already in FAIL state
    return {
      status: GateStatus.FAIL,
      message: 'Deliverability gate FAILED. Promotions and campaigns blocked.',
      blockedFeatures: ['promotions', 'campaigns'],
      failedAt: existingGate.failedAt,
      canOverride: true,
      overrideWarning:
        'Sending promotions may damage sender reputation and reduce revenue.',
    }
  }

  /**
   * Evaluate funnel throughput gate
   * Thresholds from spec:
   * - Acceptable variance: ±10% WoW
   * - Critical trigger: CR <2% for 3 consecutive business days
   */
  async evaluateFunnelThroughputGate(
    merchantId: string,
    currentCR: number,
    previousCR: number,
    consecutiveLowDays: number,
  ): Promise<GateEvaluationResult> {
    // Check critical threshold: CR <2% for 3+ consecutive business days
    if (consecutiveLowDays >= 3 && currentCR < 0.02) {
      await this.updateGateState(merchantId, GateType.FUNNEL_THROUGHPUT, {
        status: GateStatus.FAIL,
        metrics: {
          currentCR,
          consecutiveLowDays,
        },
      })

      return {
        status: GateStatus.FAIL,
        message:
          'Conversion rate below 2% for 3 consecutive business days. Do not scale traffic.',
        blockedFeatures: ['paid_acquisition_scaling'],
        canOverride: true,
        overrideWarning:
          'Scaling traffic with broken funnel will waste ad spend.',
      }
    }

    // Check WoW variance
    if (previousCR > 0) {
      const variance = Math.abs(currentCR - previousCR) / previousCR

      if (variance > 0.10) {
        // >10% variance
        await this.updateGateState(merchantId, GateType.FUNNEL_THROUGHPUT, {
          status: GateStatus.WARNING,
          metrics: {
            currentCR,
            previousCR,
            variance: variance * 100,
          },
        })

        return {
          status: GateStatus.WARNING,
          message: `Conversion rate variance ${(variance * 100).toFixed(1)}% WoW. Monitor funnel stability.`,
          blockedFeatures: [],
          canOverride: false,
        }
      }
    }

    // Pass
    await this.clearGateState(merchantId, GateType.FUNNEL_THROUGHPUT)

    return {
      status: GateStatus.PASS,
      message: 'Funnel throughput stable',
      blockedFeatures: [],
      canOverride: false,
    }
  }

  /**
   * Check if feature is blocked by gates
   */
  async isFeatureBlocked(
    merchantId: string,
    feature: string,
  ): Promise<{
    blocked: boolean
    reason?: string
    gate?: GateType
  }> {
    const gates = await this.getAllGates(merchantId)

    for (const gate of gates) {
      if (gate.status === GateStatus.FAIL) {
        // Check if this gate blocks the feature
        const blockedFeatures = this.getBlockedFeatures(gate.gateType)

        if (blockedFeatures.includes(feature)) {
          return {
            blocked: true,
            reason: `Blocked by ${gate.gateType} gate`,
            gate: gate.gateType,
          }
        }
      }
    }

    return { blocked: false }
  }

  /**
   * Get all gates for merchant
   */
  async getAllGates(merchantId: string): Promise<GateState[]> {
    return await this.gateStateRepository.find({
      where: { merchantId },
    })
  }

  /**
   * Get specific gate state
   */
  async getGateState(
    merchantId: string,
    gateType: GateType,
  ): Promise<GateState | null> {
    return await this.gateStateRepository.findOne({
      where: { merchantId, gateType },
    })
  }

  /**
   * Update gate state
   */
  private async updateGateState(
    merchantId: string,
    gateType: GateType,
    data: Partial<GateState>,
  ): Promise<void> {
    let gate = await this.gateStateRepository.findOne({
      where: { merchantId, gateType },
    })

    if (gate) {
      Object.assign(gate, data)
    } else {
      gate = this.gateStateRepository.create({
        merchantId,
        gateType,
        ...data,
      } as GateState)
    }

    await this.gateStateRepository.save(gate)
  }

  /**
   * Clear gate state (set to PASS)
   */
  private async clearGateState(
    merchantId: string,
    gateType: GateType,
  ): Promise<void> {
    await this.gateStateRepository.delete({
      merchantId,
      gateType,
    })
  }

  /**
   * Get features blocked by a gate type
   */
  private getBlockedFeatures(gateType: GateType): string[] {
    switch (gateType) {
      case GateType.DELIVERABILITY:
        return ['promotions', 'campaigns']
      case GateType.FUNNEL_THROUGHPUT:
        return ['paid_acquisition_scaling']
      case GateType.OFFER_VALIDATION:
        return ['paid_acquisition']
      default:
        return []
    }
  }

  /**
   * Log gate override (for audit trail)
   */
  async logGateOverride(
    merchantId: string,
    gateType: GateType,
    userId: string,
    reason: string,
  ): Promise<void> {
    this.logger.warn(
      `Gate override: ${gateType} for merchant ${merchantId} by user ${userId}. Reason: ${reason}`,
    )

    await this.gateOverrideRepository.save({
      merchantId,
      gateType,
      userId,
      reason,
    })
  }

  /**
   * Check gate status (stub - simplified version)
   */
  async checkGate(merchantId: string, gateType: string): Promise<any> {
    const gates = await this.getAllGates(merchantId)
    const gate = gates.find((g) => g.gateType === gateType)

    return {
      status: gate?.status || 'pass',
      metrics: {},
      thresholds: {},
    }
  }
}
