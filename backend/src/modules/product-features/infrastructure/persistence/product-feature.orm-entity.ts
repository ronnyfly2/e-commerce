import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';

@Entity('product_features')
export class ProductFeatureOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Index()
  @Column({ name: 'product_id' })
  productId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  value: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;
}
