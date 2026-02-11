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
import { Customer } from '../../customers/entities/customer.entity'

export enum DeviceType {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  UNKNOWN = 'unknown',
}

@Entity('orders')
@Index(['merchantId', 'shopifyOrderId'], { unique: true })
@Index(['merchantId', 'createdAt'])
@Index(['customerId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column('uuid', { nullable: true })
  customerId: string | null

  @Column('bigint')
  shopifyOrderId: string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  revenue: number

  @Column({
    type: 'enum',
    enum: DeviceType,
    nullable: true,
  })
  deviceType: DeviceType

  @Column({ nullable: true, length: 100 })
  attributionSource: string

  @Column({ nullable: true, length: 50 })
  attributionFlowType: string

  @Column({ nullable: true, length: 100 })
  utmSource: string

  @Column({ nullable: true, length: 100 })
  utmMedium: string

  @Column({ nullable: true, length: 100 })
  utmCampaign: string

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer
}
