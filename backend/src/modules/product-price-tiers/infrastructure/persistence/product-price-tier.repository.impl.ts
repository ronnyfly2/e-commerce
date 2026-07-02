import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPriceTierOrmEntity } from './product-price-tier.orm-entity';

export abstract class ProductPriceTierRepository {
  abstract create(data: Partial<ProductPriceTierOrmEntity>): Promise<ProductPriceTierOrmEntity>;
  abstract findByProduct(productId: string, companyId: string): Promise<ProductPriceTierOrmEntity[]>;
  abstract findById(id: string, companyId: string): Promise<ProductPriceTierOrmEntity | null>;
  abstract update(id: string, data: Partial<ProductPriceTierOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class ProductPriceTierRepositoryImpl implements ProductPriceTierRepository {
  constructor(
    @InjectRepository(ProductPriceTierOrmEntity)
    private readonly repo: Repository<ProductPriceTierOrmEntity>,
  ) {}

  create(data: Partial<ProductPriceTierOrmEntity>): Promise<ProductPriceTierOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findByProduct(productId: string, companyId: string): Promise<ProductPriceTierOrmEntity[]> {
    return this.repo.find({
      where: { productId, companyId },
      order: { minQuantity: 'ASC' },
    });
  }

  findById(id: string, companyId: string): Promise<ProductPriceTierOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  async update(id: string, data: Partial<ProductPriceTierOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
