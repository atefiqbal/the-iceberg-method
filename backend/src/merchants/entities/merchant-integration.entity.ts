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

export enum IntegrationProvider {
  SHOPIFY = 'shopify',
  KLAVIYO = 'klaviyo',
  HOTJAR = 'hotjar',
  CLARITY = 'clarity',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

@Entity('merchant_integrations')
@Index(['merchantId', 'provider'], { unique: true })
export class MerchantIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column({
    type: 'enum',
    enum: IntegrationProvider,
  })
  provider: IntegrationProvider

  @Column({ nullable: true })
  encryptedToken: string

  @Column({ nullable: true, length: 32 })
  iv: string

  @Column({ nullable: true, length: 32 })
  authTag: string

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.ACTIVE,
  })
  status: IntegrationStatus

  @Column({ nullable: true })
  lastSyncAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant
}
