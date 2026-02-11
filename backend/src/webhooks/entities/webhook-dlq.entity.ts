import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum DLQStatus {
  FAILED = 'failed',
  RETRYING = 'retrying',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

@Entity('webhook_dlq')
export class WebhookDLQ {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({ type: 'varchar', length: 100 })
  webhookId: string // Original Shopify webhook ID

  @Column({ type: 'varchar', length: 100 })
  topic: string // e.g., "orders/create"

  @Column({ type: 'varchar', length: 255 })
  shopDomain: string

  @Column({ type: 'jsonb' })
  payload: any

  @Column({ type: 'text' })
  errorMessage: string

  @Column({ type: 'text', nullable: true })
  errorStack: string | null

  @Column({ type: 'integer', default: 0 })
  retryCount: number

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date | null

  @Column({ type: 'enum', enum: DLQStatus, default: DLQStatus.FAILED })
  status: DLQStatus

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolvedBy: string | null // Admin user ID who resolved it

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
