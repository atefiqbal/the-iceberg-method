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

/**
 * Tracks processed webhook events for idempotency
 * Prevents duplicate processing if Shopify retries
 */
@Entity('webhook_events')
@Index(['eventId'], { unique: true })
@Index(['merchantId', 'topic'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column()
  eventId: string

  @Column({ length: 100 })
  topic: string

  @CreateDateColumn()
  processedAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
