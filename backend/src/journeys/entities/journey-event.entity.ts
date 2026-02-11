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

export enum JourneyEventType {
  // Pre-purchase events
  BROWSED = 'browsed',
  ADDED_TO_CART = 'added_to_cart',
  INITIATED_CHECKOUT = 'initiated_checkout',
  ABANDONED_CART = 'abandoned_cart',
  ABANDONED_CHECKOUT = 'abandoned_checkout',

  // Purchase events
  FIRST_PURCHASE = 'first_purchase',
  REPEAT_PURCHASE = 'repeat_purchase',
  PRODUCT_STEP_ADVANCED = 'product_step_advanced',

  // Flow events
  FLOW_ENTERED = 'flow_entered',
  FLOW_EMAIL_SENT = 'flow_email_sent',
  FLOW_EMAIL_OPENED = 'flow_email_opened',
  FLOW_EMAIL_CLICKED = 'flow_email_clicked',
  FLOW_COMPLETED = 'flow_completed',
  FLOW_EXITED = 'flow_exited',

  // Re-engagement
  WIN_BACK_TRIGGERED = 'win_back_triggered',
  REACTIVATED = 'reactivated',
}

/**
 * Audit trail for customer journey state changes
 * Enables analytics and debugging of flow logic
 */
@Entity('journey_events')
@Index(['merchantId', 'customerId', 'createdAt'])
@Index(['merchantId', 'eventType'])
export class JourneyEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column('uuid')
  customerId: string

  @Column({
    type: 'enum',
    enum: JourneyEventType,
  })
  eventType: JourneyEventType

  @Column({ type: 'jsonb', nullable: true })
  eventData: Record<string, any>

  @Column({ nullable: true })
  flowName: string

  @Column({ nullable: true })
  emailId: string

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
