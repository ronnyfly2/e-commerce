import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';

@Entity('currencies')
export class CurrencyOrmEntity extends BaseOrmEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 3 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  exchangeRate: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
