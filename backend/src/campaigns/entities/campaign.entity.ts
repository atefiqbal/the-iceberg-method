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

export enum CampaignType {
  PROMOTION = 'promotion',
  ANNOUNCEMENT = 'announcement',
  EDUCATIONAL = 'educational',
  WIN_BACK = 'win_back',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum SegmentTarget {
  ALL_SUBSCRIBERS = 'all_subscribers',
  POST_PURCHASE = 'post_purchase',
  PRE_PURCHASE = 'pre_purchase',
  PRODUCT_STEP_1 = 'product_step_1',
  PRODUCT_STEP_2 = 'product_step_2',
  PRODUCT_STEP_3 = 'product_step_3',
  INACTIVE_CUSTOMERS = 'inactive_customers',
  CUSTOM = 'custom',
}

/**
 * Campaign entity for promotional emails
 * Subject to gate enforcement (deliverability must pass)
 */
@Entity('campaigns')
@Index(['merchantId', 'status'])
@Index(['merchantId', 'scheduledAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  campaignType: CampaignType

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus

  @Column({
    type: 'enum',
    enum: SegmentTarget,
  })
  segmentTarget: SegmentTarget

  @Column({ type: 'jsonb', nullable: true })
  customSegmentFilters: Record<string, any>

  // Email content
  @Column({ type: 'varchar', length: 500 })
  subject: string

  @Column({ type: 'text', nullable: true })
  preheader: string

  @Column({ type: 'text' })
  bodyHtml: string

  @Column({ type: 'text' })
  bodyPlaintext: string

  // Promotion details (if applicable)
  @Column({ type: 'varchar', length: 100, nullable: true })
  promoCode: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  discountType: string // 'percentage', 'fixed_amount', 'free_shipping'

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number

  @Column({ nullable: true })
  promoExpiresAt: Date

  // Scheduling
  @Column({ nullable: true })
  scheduledAt: Date

  @Column({ nullable: true })
  sentAt: Date

  // Performance metrics
  @Column({ type: 'integer', default: 0 })
  recipientCount: number

  @Column({ type: 'integer', default: 0 })
  sentCount: number

  @Column({ type: 'integer', default: 0 })
  openedCount: number

  @Column({ type: 'integer', default: 0 })
  clickedCount: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenueGenerated: number

  // Gate enforcement
  @Column({ default: false })
  gateOverridden: boolean

  @Column({ type: 'text', nullable: true })
  gateOverrideReason: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateOverrideUserId: string

  @Column({ nullable: true })
  gateOverrideAt: Date

  // ESP integration
  @Column({ type: 'varchar', length: 255, nullable: true })
  espCampaignId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
