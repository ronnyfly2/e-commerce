import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandOrmEntity } from './brand.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class BrandRepository {
  abstract create(data: Partial<BrandOrmEntity>): Promise<BrandOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<BrandOrmEntity | null>;
  abstract findBySlug(slug: string, companyId: string): Promise<BrandOrmEntity | null>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<BrandOrmEntity>>;
  abstract update(id: string, data: Partial<BrandOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class BrandRepositoryImpl implements BrandRepository {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repo: Repository<BrandOrmEntity>,
  ) {}

  create(data: Partial<BrandOrmEntity>): Promise<BrandOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<BrandOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  findBySlug(slug: string, companyId: string): Promise<BrandOrmEntity | null> {
    return this.repo.findOne({ where: { slug, companyId } });
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<BrandOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.companyId = :companyId', { companyId })
      .orderBy('b.name', 'ASC')
      .skip(skip)
      .take(take);

    if (search) qb.andWhere('b.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<BrandOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
