import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { numericTransformer } from '@/shared/infrastructure/persistence/numeric.transformer';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';

/** Wholesale/bulk pricing: buying >= minQuantity units of this product drops the unit price. */
@Entity('product_price_tiers')
@Unique(['productId', 'minQuantity'])
export class ProductPriceTierOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'min_quantity', type: 'int' })
  minQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: numericTransformer })
  price: number;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;
}
