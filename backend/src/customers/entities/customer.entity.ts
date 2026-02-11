import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm'
import { Merchant } from '../../merchants/entities/merchant.entity'
import { Order } from '../../orders/entities/order.entity'

@Entity('customers')
@Index(['merchantId', 'shopifyCustomerId'], { unique: true })
@Index(['merchantId', 'isPostPurchase'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  merchantId: string

  @Column('bigint')
  shopifyCustomerId: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true, length: 50 })
  phone: string

  @Column({ nullable: true, length: 100 })
  firstName: string

  @Column({ nullable: true, length: 100 })
  lastName: string

  @Column({ default: false })
  isPostPurchase: boolean

  @Column({ nullable: true })
  firstPurchaseAt: Date

  @Column({ nullable: true })
  lastPurchaseAt: Date

  @Column({ default: 0 })
  totalOrders: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetimeValue: number

  @Column({ default: 0 })
  currentProductStep: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[]
}
