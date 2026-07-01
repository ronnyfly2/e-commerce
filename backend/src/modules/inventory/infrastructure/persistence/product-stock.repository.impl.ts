import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockOrmEntity } from './product-stock.orm-entity';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';

export abstract class ProductStockRepository {
  abstract createManyForProduct(productId: string, companyId: string, storeIds: string[]): Promise<void>;
  abstract findByProduct(productId: string, companyId: string): Promise<ProductStockOrmEntity[]>;
  abstract findById(id: string, companyId: string): Promise<ProductStockOrmEntity | null>;
  abstract updateQuantity(id: string, quantity: number): Promise<void>;
}

@Injectable()
export class ProductStockRepositoryImpl implements ProductStockRepository {
  constructor(
    @InjectRepository(ProductStockOrmEntity)
    private readonly repo: Repository<ProductStockOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productRepo: Repository<ProductOrmEntity>,
  ) {}

  async createManyForProduct(productId: string, companyId: string, storeIds: string[]): Promise<void> {
    if (storeIds.length === 0) return;
    await this.repo.insert(
      storeIds.map((storeId) => ({ productId, companyId, storeId, quantity: 0 })),
    );
  }

  findByProduct(productId: string, companyId: string): Promise<ProductStockOrmEntity[]> {
    return this.repo.find({
      where: { productId, companyId },
      relations: { store: true },
      order: { store: { name: 'ASC' } },
    });
  }

  findById(id: string, companyId: string): Promise<ProductStockOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId }, relations: { store: true } });
  }

  async updateQuantity(id: string, quantity: number): Promise<void> {
    const stock = await this.repo.findOne({ where: { id } });
    if (!stock) return;

    await this.repo.update(id, { quantity });
    await this.syncProductTotal(stock.productId);
  }

  /** `product.stock` is a denormalized cache of SUM(product_stocks.quantity) for fast list/detail reads. */
  private async syncProductTotal(productId: string): Promise<void> {
    const row = await this.repo
      .createQueryBuilder('ps')
      .select('COALESCE(SUM(ps.quantity), 0)', 'sum')
      .where('ps.productId = :productId', { productId })
      .getRawOne<{ sum: string }>();

    await this.productRepo.update(productId, { stock: parseInt(row?.sum ?? '0', 10) });
  }
}
