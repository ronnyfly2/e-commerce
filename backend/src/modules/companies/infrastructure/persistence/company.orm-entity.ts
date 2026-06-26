import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';

@Entity('companies')
export class CompanyOrmEntity extends BaseOrmEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string;

  @Index({ unique: true })
  @Column({ length: 20 })
  ruc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
