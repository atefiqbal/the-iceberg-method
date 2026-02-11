import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('baselines')
export class Baseline {
  @PrimaryColumn('uuid')
  merchantId: string

  @Column({ type: 'jsonb' })
  baselineByDow: Record<string, number> // Day of week (0-6) -> average revenue

  @CreateDateColumn()
  calculatedAt: Date

  @Column()
  lookbackDays: number

  @Column()
  dataPointsUsed: number

  @Column({ default: true })
  isProvisional: boolean

  @Column({ default: 0 })
  anomaliesExcluded: number

  @UpdateDateColumn()
  updatedAt: Date
}
