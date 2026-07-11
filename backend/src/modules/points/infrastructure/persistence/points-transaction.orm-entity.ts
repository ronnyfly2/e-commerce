import {
  Column, CreateDateColumn, Entity,
  Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { PointsTransactionType } from '../../domain/enums/points-transaction-type.enum';

@Entity('points_transactions')
export class PointsTransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 20 })
  type: PointsTransactionType;

  /** Signed delta — positive credits, negative debits. */
  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  /** Set when type=PURCHASE or REVERSAL — the order that triggered this transaction. */
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  /** Set when type=MANUAL — the staff member who made the adjustment. */
  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;
}
