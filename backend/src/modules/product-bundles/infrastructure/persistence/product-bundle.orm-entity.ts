import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { numericTransformer } from '@/shared/infrastructure/persistence/numeric.transformer';
import { ProductBundleItemOrmEntity } from './product-bundle-item.orm-entity';

/** A curated set of products (e.g. different colors/items) sold together at a fixed price — used for wholesale/combo deals. */
@Entity('product_bundles')
export class ProductBundleOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: numericTransformer })
  price: number;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ProductBundleItemOrmEntity, (item) => item.bundle)
  items: ProductBundleItemOrmEntity[];
}
