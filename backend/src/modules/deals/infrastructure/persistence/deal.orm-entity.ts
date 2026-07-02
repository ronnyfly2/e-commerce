import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { numericTransformer } from '@/shared/infrastructure/persistence/numeric.transformer';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { DealStage } from '../../domain/deal-stage.enum';

@Entity('deals')
export class DealOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'enum', enum: DealStage, default: DealStage.NEW })
  stage: DealStage;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, transformer: numericTransformer })
  value: number | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'USD' })
  currencyCode: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId: string | null;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate: string | null;

  @ManyToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;
}
