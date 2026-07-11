import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { CustomerSource } from '../../domain/customer-source.enum';

@Entity('customers')
@Unique(['companyId', 'phone'])
export class CustomerOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 150 })
  name: string;

  /** E.164-ish phone number — the key used to match inbound WhatsApp messages to a customer. */
  @Column({ length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: CustomerSource, default: CustomerSource.MANUAL })
  source: CustomerSource;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** Denormalized cache of SUM(points_transactions.points) — only written by the `points` module, inside a transaction. */
  @Column({ name: 'points_balance', default: 0 })
  pointsBalance: number;
}
