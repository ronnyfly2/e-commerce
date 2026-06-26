import { Column, Entity } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { Permission } from '@/shared/domain/permission.enum';

@Entity('roles')
export class RoleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'simple-array', default: '' })
  permissions: Permission[];

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;
}
