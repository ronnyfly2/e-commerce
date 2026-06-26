import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class CompanyRepository {
  abstract create(data: Partial<CompanyOrmEntity>): Promise<CompanyOrmEntity>;
  abstract findById(id: string): Promise<CompanyOrmEntity | null>;
  abstract findBySlug(slug: string): Promise<CompanyOrmEntity | null>;
  abstract findByRuc(ruc: string): Promise<CompanyOrmEntity | null>;
  abstract findAll(query: PaginationQueryDto): Promise<Page<CompanyOrmEntity>>;
  abstract update(id: string, data: Partial<CompanyOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class CompanyRepositoryImpl implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly repo: Repository<CompanyOrmEntity>,
  ) {}

  create(data: Partial<CompanyOrmEntity>): Promise<CompanyOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string): Promise<CompanyOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<CompanyOrmEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  findByRuc(ruc: string): Promise<CompanyOrmEntity | null> {
    return this.repo.findOne({ where: { ruc } });
  }

  async findAll(query: PaginationQueryDto): Promise<Page<CompanyOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const where = search ? { name: ILike(`%${search}%`) } : {};

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<CompanyOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
