import {
  Column, Entity, Index, JoinColumn, ManyToOne, OneToMany,
} from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { BranchOrmEntity } from '@/modules/branches/infrastructure/persistence/branch.orm-entity';
import { StoreOrmEntity } from '@/modules/stores/infrastructure/persistence/store.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderChannel } from '../../domain/enums/order-channel.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { DeliveryType } from '../../domain/enums/delivery-type.enum';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import { OrderStatusHistoryOrmEntity } from './order-status-history.orm-entity';

@Entity('orders')
export class OrderOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId: string | null;

  /** Set once stock has been decremented for this order (on CONFIRMED) — guards against double-decrement/restore. */
  @Column({ name: 'stock_decremented', default: false })
  stockDecremented: boolean;

  /** Set once loyalty points have been credited for this order (on paymentStatus=PAID) — guards against double-credit/reversal. */
  @Column({ name: 'points_credited', default: false })
  pointsCredited: boolean;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Index({ unique: true })
  @Column({ name: 'order_number', type: 'varchar', length: 40 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 20 })
  channel: OrderChannel;

  @Column({ type: 'varchar', length: 30, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'payment_status', type: 'varchar', length: 20, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ name: 'delivery_type', type: 'varchar', length: 20, default: DeliveryType.DELIVERY })
  deliveryType: DeliveryType;

  // ─── Customer ───────────────────────────────────────────────────────────────
  @Column({ name: 'customer_name', type: 'varchar', length: 150 })
  customerName: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 150, nullable: true })
  customerEmail: string | null;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30, nullable: true })
  customerPhone: string | null;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string | null;

  // ─── Delivery address ───────────────────────────────────────────────────────
  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress: string | null;

  @Column({ name: 'delivery_city', type: 'varchar', length: 100, nullable: true })
  deliveryCity: string | null;

  @Column({ name: 'delivery_state', type: 'varchar', length: 100, nullable: true })
  deliveryState: string | null;

  @Column({ name: 'delivery_zip', type: 'varchar', length: 20, nullable: true })
  deliveryZip: string | null;

  @Column({ name: 'delivery_reference', type: 'text', nullable: true })
  deliveryReference: string | null;

  // ─── Money (integer cents) ───────────────────────────────────────────────────
  @Column({ name: 'subtotal_cents', type: 'int' })
  subtotalCents: number;

  @Column({ name: 'discount_cents', type: 'int', default: 0 })
  discountCents: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0 })
  taxCents: number;

  @Column({ name: 'shipping_cents', type: 'int', default: 0 })
  shippingCents: number;

  @Column({ name: 'total_cents', type: 'int' })
  totalCents: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'USD' })
  currencyCode: string;

  // ─── Assignment ─────────────────────────────────────────────────────────────
  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId: string | null;

  // ─── Internal ───────────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ─── Key timestamps ─────────────────────────────────────────────────────────
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  // ─── Relations ──────────────────────────────────────────────────────────────
  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, { cascade: true, eager: false })
  items: OrderItemOrmEntity[];

  @OneToMany(() => OrderStatusHistoryOrmEntity, (h) => h.order, { cascade: true, eager: false })
  statusHistory: OrderStatusHistoryOrmEntity[];

  @ManyToOne(() => BranchOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: BranchOrmEntity | null;

  @ManyToOne(() => StoreOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: StoreOrmEntity | null;

  @ManyToOne(() => CustomerOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity | null;
}
