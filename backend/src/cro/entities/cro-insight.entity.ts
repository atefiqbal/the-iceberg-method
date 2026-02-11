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

export enum CROInsightType {
  RAGE_CLICK = 'rage_click',
  DEAD_CLICK = 'dead_click',
  ERROR_CLICK = 'error_click',
  QUICK_BACK = 'quick_back',
  EXCESSIVE_SCROLLING = 'excessive_scrolling',
}

export enum CROInsightSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PageType {
  HOMEPAGE = 'homepage',
  PRODUCT = 'product',
  COLLECTION = 'collection',
  CART = 'cart',
  CHECKOUT = 'checkout',
  OTHER = 'other',
}

/**
 * Stores CRO insights from behavior analytics tools
 * Helps identify friction points in the customer journey
 */
@Entity('cro_insights')
@Index(['merchantId', 'pageType', 'createdAt'])
@Index(['merchantId', 'severity', 'resolved'])
export class CROInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({
    type: 'enum',
    enum: CROInsightType,
  })
  insightType: CROInsightType

  @Column({
    type: 'enum',
    enum: CROInsightSeverity,
  })
  severity: CROInsightSeverity

  @Column({
    type: 'enum',
    enum: PageType,
  })
  pageType: PageType

  @Column({ type: 'text' })
  pageUrl: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  elementSelector: string

  @Column({ type: 'integer', default: 1 })
  occurrences: number

  @Column({ type: 'jsonb', nullable: true })
  sessionUrls: string[] // Links to session recordings

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: false })
  resolved: boolean

  @Column({ nullable: true })
  resolvedAt: Date

  @Column({ type: 'text', nullable: true })
  resolvedNote: string

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
