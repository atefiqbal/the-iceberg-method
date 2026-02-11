import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Merchant } from '../../merchants/entities/merchant.entity'

export enum JourneyStage {
  PRE_PURCHASE = 'pre_purchase',
  POST_PURCHASE = 'post_purchase',
}

export enum ProductStep {
  STEP_0 = 0, // No purchase yet
  STEP_1 = 1, // First product purchased
  STEP_2 = 2, // Second product in hierarchy
  STEP_3 = 3, // Third product in hierarchy
}

export enum FlowState {
  NONE = 'none',
  WELCOME = 'welcome',
  ABANDONED_CART = 'abandoned_cart',
  ABANDONED_CHECKOUT = 'abandoned_checkout',
  POST_PURCHASE_EDUCATION = 'post_purchase_education',
  WIN_BACK = 'win_back',
  BROWSE_ABANDONMENT = 'browse_abandonment',
}

/**
 * Tracks customer journey state for personalized messaging
 * Core to Phase 2: Segmentation & Journey Logic
 */
@Entity('customer_journeys')
@Index(['merchantId', 'customerId'], { unique: true })
@Index(['merchantId', 'journeyStage'])
@Index(['merchantId', 'productStep'])
export class CustomerJourney {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column('uuid')
  customerId: string

  // Journey State
  @Column({
    type: 'enum',
    enum: JourneyStage,
    default: JourneyStage.PRE_PURCHASE,
  })
  journeyStage: JourneyStage

  @Column({
    type: 'enum',
    enum: ProductStep,
    default: ProductStep.STEP_0,
  })
  productStep: ProductStep

  @Column({
    type: 'enum',
    enum: FlowState,
    default: FlowState.NONE,
  })
  currentFlow: FlowState

  // Metadata
  @Column({ nullable: true })
  firstPurchaseAt: Date

  @Column({ nullable: true })
  lastPurchaseAt: Date

  @Column({ default: 0 })
  totalPurchases: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetimeValue: number

  @Column({ nullable: true })
  lastEmailSentAt: Date

  @Column({ nullable: true })
  lastFlowCompletedAt: Date

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
