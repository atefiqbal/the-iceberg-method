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
import { Merchant } from './merchant.entity'

export interface ProductLadderStep {
  stepNumber: number // 1, 2, 3
  productIds: string[] // Shopify product IDs
  productTitles: string[] // Product names for display
  name: string // e.g., "Entry Product", "Mid-Tier", "Premium"
  description?: string
}

/**
 * Product ladder configuration for progressive selling
 * Enables product-based customer progression tracking
 */
@Entity('product_ladders')
@Index(['merchantId'])
export class ProductLadder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({ type: 'jsonb' })
  steps: ProductLadderStep[]

  @Column({ default: true })
  active: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
