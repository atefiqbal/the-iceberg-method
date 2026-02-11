import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Merchant } from '../../merchants/entities/merchant.entity'

export enum GateType {
  DELIVERABILITY = 'deliverability',
  FUNNEL_THROUGHPUT = 'funnel_throughput',
  CRO_REVIEW = 'cro_review',
  OFFER_VALIDATION = 'offer_validation',
  PAID_ACQUISITION = 'paid_acquisition',
}

export enum GateStatus {
  PASS = 'pass',
  WARNING = 'warning',
  FAIL = 'fail',
  GRACE_PERIOD = 'grace_period',
}

@Entity('gate_states')
export class GateState {
  @PrimaryColumn('uuid')
  merchantId: string

  @PrimaryColumn({
    type: 'enum',
    enum: GateType,
  })
  gateType: GateType

  @Column({
    type: 'enum',
    enum: GateStatus,
  })
  status: GateStatus

  @Column({ nullable: true })
  failedAt: Date

  @Column({ nullable: true })
  gracePeriodEndsAt: Date

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any>

  @Column({ type: 'text', nullable: true })
  message: string

  @Column({ type: 'simple-array', nullable: true })
  blockedFeatures: string[]

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastEvaluatedAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.gates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
