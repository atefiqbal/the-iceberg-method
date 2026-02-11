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

export enum TemplateType {
  WELCOME = 'welcome',
  ABANDONED_CART = 'abandoned_cart',
  ABANDONED_CHECKOUT = 'abandoned_checkout',
  BROWSE_ABANDONMENT = 'browse_abandonment',
  POST_PURCHASE = 'post_purchase',
  WIN_BACK = 'win_back',
  CUSTOM = 'custom',
}

export interface EmailTemplateStep {
  stepNumber: number
  delayHours: number
  subject: string
  preheader?: string
  bodyHtml: string
  bodyPlaintext: string
  variables: string[]
}

/**
 * Email template for lifecycle flows
 * Can be system-provided (proven templates) or merchant-customized
 */
@Entity('email_templates')
@Index(['merchantId', 'templateType'])
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { nullable: true })
  merchantId: string // null = system template

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({
    type: 'enum',
    enum: TemplateType,
  })
  templateType: TemplateType

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'jsonb' })
  steps: EmailTemplateStep[]

  @Column({ default: false })
  isSystemTemplate: boolean // true = provided by platform

  @Column({ default: false })
  proven: boolean // true = high-performing tested template

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  conversionBenchmark: number // Expected conversion rate (e.g., 0.08 = 8%)

  @Column({ default: true })
  active: boolean

  @Column({ type: 'uuid', nullable: true })
  basedOnTemplateId: string // Reference to system template if customized

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
