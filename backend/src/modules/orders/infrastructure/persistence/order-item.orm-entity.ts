import {
  Column, CreateDateColumn, Entity,
  Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

@Entity('order_items')
export class OrderItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  /** Set when this line is a bundle purchase — stock is decremented per bundle component, not this column. */
  @Column({ name: 'bundle_id', type: 'uuid', nullable: true })
  bundleId: string | null;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string;

  @Column({ name: 'product_sku', type: 'varchar', length: 100, nullable: true })
  productSku: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price_cents', type: 'int' })
  unitPriceCents: number;

  @Column({ name: 'total_price_cents', type: 'int' })
  totalPriceCents: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrderOrmEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;
}
