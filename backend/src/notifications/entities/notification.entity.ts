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

export enum NotificationType {
  GATE_VIOLATION = 'gate_violation',
  INTEGRATION_ERROR = 'integration_error',
  BASELINE_READY = 'baseline_ready',
  PHASE_UNLOCKED = 'phase_unlocked',
  WEEKLY_REPORT_READY = 'weekly_report_ready',
  DATA_PIPELINE_FAILURE = 'data_pipeline_failure',
  RATE_LIMIT_WARNING = 'rate_limit_warning',
  DLQ_THRESHOLD = 'dlq_threshold',
}

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('notifications')
@Index(['merchantId', 'createdAt'])
@Index(['merchantId', 'readAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType

  @Column({
    type: 'enum',
    enum: NotificationSeverity,
    default: NotificationSeverity.INFO,
  })
  severity: NotificationSeverity

  @Column({ length: 255 })
  title: string

  @Column('text')
  message: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrl: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
