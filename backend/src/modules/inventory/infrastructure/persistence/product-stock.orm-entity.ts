import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';
import { StoreOrmEntity } from '@/modules/stores/infrastructure/persistence/store.orm-entity';

@Entity('product_stocks')
@Unique(['productId', 'storeId'])
export class ProductStockOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ default: 0 })
  quantity: number;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;

  @ManyToOne(() => StoreOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: StoreOrmEntity;
}
