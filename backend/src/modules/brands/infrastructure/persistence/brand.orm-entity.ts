import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';

@Entity('brands')
@Unique(['companyId', 'slug'])
export class BrandOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ name: 'logo_url', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
