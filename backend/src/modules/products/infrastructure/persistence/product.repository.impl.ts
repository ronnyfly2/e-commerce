import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class ProductRepository {
  abstract create(data: Partial<ProductOrmEntity>): Promise<ProductOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<ProductOrmEntity | null>;
  abstract findBySku(sku: string, companyId: string): Promise<ProductOrmEntity | null>;
  abstract findBySlug(slug: string, companyId: string): Promise<ProductOrmEntity | null>;
  abstract findAll(companyId: string, query: ProductQuery): Promise<Page<ProductOrmEntity>>;
  abstract update(id: string, data: Partial<ProductOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

export interface ProductQuery extends PaginationQueryDto {
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  create(data: Partial<ProductOrmEntity>): Promise<ProductOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<ProductOrmEntity | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: { category: true, brand: true },
    });
  }

  findBySku(sku: string, companyId: string): Promise<ProductOrmEntity | null> {
    return this.repo.findOne({ where: { sku, companyId } });
  }

  findBySlug(slug: string, companyId: string): Promise<ProductOrmEntity | null> {
    return this.repo.findOne({ where: { slug, companyId } });
  }

  async findAll(companyId: string, query: ProductQuery): Promise<Page<ProductOrmEntity>> {
    const { page = 1, limit = 20, search, categoryId, brandId, isActive } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .where('p.companyId = :companyId', { companyId })
      .orderBy('p.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) {
      qb.andWhere('(p.name ILIKE :s OR p.sku ILIKE :s)', { s: `%${search}%` });
    }
    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (brandId) qb.andWhere('p.brandId = :brandId', { brandId });
    if (isActive !== undefined) qb.andWhere('p.isActive = :isActive', { isActive });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<ProductOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
