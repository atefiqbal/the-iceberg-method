import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum BackfillStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum BackfillType {
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  PRODUCTS = 'products',
  FULL = 'full',
}

@Entity('backfill_jobs')
export class BackfillJob {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({ type: 'enum', enum: BackfillType })
  backfillType: BackfillType

  @Column({ type: 'enum', enum: BackfillStatus, default: BackfillStatus.PENDING })
  status: BackfillStatus

  @Column({ type: 'integer', default: 0 })
  totalRecords: number

  @Column({ type: 'integer', default: 0 })
  processedRecords: number

  @Column({ type: 'integer', default: 0 })
  failedRecords: number

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    startDate?: string // ISO date for backfill range
    endDate?: string
    lastProcessedId?: string // For pagination
    batchSize?: number
    retryCount?: number
  }

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Computed progress percentage
  get progress(): number {
    if (this.totalRecords === 0) return 0
    return Math.round((this.processedRecords / this.totalRecords) * 100)
  }
}
