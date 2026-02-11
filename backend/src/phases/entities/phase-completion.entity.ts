import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Merchant } from '../../merchants/entities/merchant.entity'

export enum PhaseType {
  DELIVERABILITY = 'deliverability',
  CORE_FLOWS = 'core_flows',
  SEGMENTATION = 'segmentation',
  CONVERSION_MEASUREMENT = 'conversion_measurement',
  CRO_OBSERVATION = 'cro_observation',
  REVENUE_ACTIVATION = 'revenue_activation',
  OFFER_CONSTRUCTION = 'offer_construction',
  PAID_ACQUISITION = 'paid_acquisition',
}

export enum PhaseStatus {
  LOCKED = 'locked',
  CURRENT = 'current',
  COMPLETED = 'completed',
}

@Entity('phase_completions')
export class PhaseCompletion {
  @PrimaryColumn('uuid')
  merchantId: string

  @PrimaryColumn({
    type: 'enum',
    enum: PhaseType,
  })
  phase: PhaseType

  @Column({
    type: 'enum',
    enum: PhaseStatus,
    default: PhaseStatus.LOCKED,
  })
  status: PhaseStatus

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.phaseCompletions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
