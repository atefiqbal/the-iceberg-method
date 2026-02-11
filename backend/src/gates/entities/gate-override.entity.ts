import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Merchant } from '../../merchants/entities/merchant.entity'
import { GateType } from './gate-state.entity'

/**
 * Audit trail for gate overrides
 * Tracks when gates are manually overridden with justification
 */
@Entity('gate_overrides')
@Index(['merchantId', 'gateType'])
export class GateOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({
    type: 'enum',
    enum: GateType,
  })
  gateType: GateType

  @Column()
  userId: string // TODO: Reference users table when user auth exists

  @Column('text')
  reason: string

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
