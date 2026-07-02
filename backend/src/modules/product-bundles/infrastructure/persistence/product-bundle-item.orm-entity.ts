import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';
import { ProductBundleOrmEntity } from './product-bundle.orm-entity';

@Entity('product_bundle_items')
@Unique(['bundleId', 'productId'])
export class ProductBundleItemOrmEntity extends BaseOrmEntity {
  @Column({ name: 'bundle_id' })
  bundleId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => ProductBundleOrmEntity, (bundle) => bundle.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bundle_id' })
  bundle: ProductBundleOrmEntity;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;
}
