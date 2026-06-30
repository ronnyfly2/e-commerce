import {
  Column, CreateDateColumn, Entity,
  Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderOrmEntity } from './order.orm-entity';

@Entity('order_status_history')
export class OrderStatusHistoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'from_status', type: 'varchar', length: 30, nullable: true })
  fromStatus: OrderStatus | null;

  @Column({ name: 'to_status', type: 'varchar', length: 30 })
  toStatus: OrderStatus;

  @Column({ name: 'changed_by_id', type: 'uuid', nullable: true })
  changedById: string | null;

  @Column({ name: 'changed_by_name', type: 'varchar', length: 100, nullable: true })
  changedByName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => OrderOrmEntity, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;
}
