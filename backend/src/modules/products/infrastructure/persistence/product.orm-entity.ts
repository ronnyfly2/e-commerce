import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { BrandOrmEntity } from '@/modules/brands/infrastructure/persistence/brand.orm-entity';
import { CategoryOrmEntity } from '@/modules/categories/infrastructure/persistence/category.orm-entity';

@Entity('products')
@Unique(['companyId', 'sku'])
@Unique(['companyId', 'slug'])
export class ProductOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ length: 100 })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  price: number;

  @Column({ name: 'compare_at_price', type: 'decimal', precision: 12, scale: 4, nullable: true })
  compareAtPrice: number | null;

  @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 4, nullable: true })
  costPrice: number | null;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'min_stock', default: 0 })
  minStock: number;

  @Column({ length: 20, default: 'unit' })
  unit: string;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => CategoryOrmEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: CategoryOrmEntity | null;

  @ManyToOne(() => BrandOrmEntity, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandOrmEntity | null;
}
