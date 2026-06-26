import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoryOrmEntity } from './category.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class CategoryRepository {
  abstract create(data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<CategoryOrmEntity | null>;
  abstract findBySlug(slug: string, companyId: string): Promise<CategoryOrmEntity | null>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<CategoryOrmEntity>>;
  abstract findTree(companyId: string): Promise<CategoryOrmEntity[]>;
  abstract update(id: string, data: Partial<CategoryOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  create(data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<CategoryOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId }, relations: ['parent', 'children'] });
  }

  findBySlug(slug: string, companyId: string): Promise<CategoryOrmEntity | null> {
    return this.repo.findOne({ where: { slug, companyId } });
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<CategoryOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.parent', 'parent')
      .where('c.companyId = :companyId', { companyId })
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .skip(skip)
      .take(take);

    if (search) qb.andWhere('c.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  findTree(companyId: string): Promise<CategoryOrmEntity[]> {
    return this.repo.find({
      where: { companyId, parentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async update(id: string, data: Partial<CategoryOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
