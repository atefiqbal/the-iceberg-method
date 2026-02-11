import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { Customer } from '../../customers/entities/customer.entity'
import { Order } from '../../orders/entities/order.entity'
import { GateState } from '../../gates/entities/gate-state.entity'
import { PhaseCompletion } from '../../phases/entities/phase-completion.entity'

export enum MerchantStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CHURNED = 'churned',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  shopifyDomain: string

  @Column()
  email: string

  @Column({ nullable: true })
  businessName: string

  @Column({ default: 'America/New_York' })
  timezone: string

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.ACTIVE,
  })
  status: MerchantStatus

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  churnedAt: Date

  // Relations
  @OneToMany(() => Customer, (customer) => customer.merchant)
  customers: Customer[]

  @OneToMany(() => Order, (order) => order.merchant)
  orders: Order[]

  @OneToMany(() => GateState, (gate) => gate.merchant)
  gates: GateState[]

  @OneToMany(() => PhaseCompletion, (phase) => phase.merchant)
  phaseCompletions: PhaseCompletion[]
}
