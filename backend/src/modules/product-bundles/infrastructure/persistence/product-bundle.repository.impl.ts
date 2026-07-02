import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBundleOrmEntity } from './product-bundle.orm-entity';
import { ProductBundleItemOrmEntity } from './product-bundle-item.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export interface BundleItemInput {
  productId: string;
  quantity: number;
}

export abstract class ProductBundleRepository {
  abstract create(
    data: Partial<ProductBundleOrmEntity>,
    items: BundleItemInput[],
  ): Promise<ProductBundleOrmEntity>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<ProductBundleOrmEntity>>;
  abstract findById(id: string, companyId: string): Promise<ProductBundleOrmEntity | null>;
  abstract update(id: string, data: Partial<ProductBundleOrmEntity>): Promise<void>;
  abstract replaceItems(bundleId: string, items: BundleItemInput[]): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class ProductBundleRepositoryImpl implements ProductBundleRepository {
  constructor(
    @InjectRepository(ProductBundleOrmEntity)
    private readonly repo: Repository<ProductBundleOrmEntity>,
    @InjectRepository(ProductBundleItemOrmEntity)
    private readonly itemRepo: Repository<ProductBundleItemOrmEntity>,
  ) {}

  async create(
    data: Partial<ProductBundleOrmEntity>,
    items: BundleItemInput[],
  ): Promise<ProductBundleOrmEntity> {
    const bundle = await this.repo.save(this.repo.create(data));
    await this.replaceItems(bundle.id, items);
    return (await this.findById(bundle.id, bundle.companyId))!;
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<ProductBundleOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.companyId = :companyId', { companyId })
      .orderBy('b.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) qb.andWhere('b.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  findById(id: string, companyId: string): Promise<ProductBundleOrmEntity | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: { items: { product: true } },
    });
  }

  async update(id: string, data: Partial<ProductBundleOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async replaceItems(bundleId: string, items: BundleItemInput[]): Promise<void> {
    await this.itemRepo.delete({ bundleId });
    if (items.length === 0) return;
    await this.itemRepo.insert(items.map((i) => ({ bundleId, productId: i.productId, quantity: i.quantity })));
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
