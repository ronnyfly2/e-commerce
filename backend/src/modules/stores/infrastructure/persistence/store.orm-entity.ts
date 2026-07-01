import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { numericTransformer } from '@/shared/infrastructure/persistence/numeric.transformer';
import { CompanyOrmEntity } from '@/modules/companies/infrastructure/persistence/company.orm-entity';
import { BranchOrmEntity } from '@/modules/branches/infrastructure/persistence/branch.orm-entity';

@Entity('stores')
@Unique(['companyId', 'code'])
export class StoreOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  code: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: numericTransformer })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: numericTransformer })
  longitude: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => CompanyOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompanyOrmEntity;

  @ManyToOne(() => BranchOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: BranchOrmEntity;
}
