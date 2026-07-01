import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductFeatureOrmEntity } from './product-feature.orm-entity';

export abstract class ProductFeatureRepository {
  abstract create(data: Partial<ProductFeatureOrmEntity>): Promise<ProductFeatureOrmEntity>;
  abstract findByProduct(productId: string, companyId: string): Promise<ProductFeatureOrmEntity[]>;
  abstract findById(id: string, companyId: string): Promise<ProductFeatureOrmEntity | null>;
  abstract update(id: string, data: Partial<ProductFeatureOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class ProductFeatureRepositoryImpl implements ProductFeatureRepository {
  constructor(
    @InjectRepository(ProductFeatureOrmEntity)
    private readonly repo: Repository<ProductFeatureOrmEntity>,
  ) {}

  create(data: Partial<ProductFeatureOrmEntity>): Promise<ProductFeatureOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findByProduct(productId: string, companyId: string): Promise<ProductFeatureOrmEntity[]> {
    return this.repo.find({
      where: { productId, companyId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findById(id: string, companyId: string): Promise<ProductFeatureOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  async update(id: string, data: Partial<ProductFeatureOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
