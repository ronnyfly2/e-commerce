import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchOrmEntity } from './branch.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class BranchRepository {
  abstract create(data: Partial<BranchOrmEntity>): Promise<BranchOrmEntity>;
  abstract findById(id: string, companyId: string | null): Promise<BranchOrmEntity | null>;
  abstract findByCode(code: string, companyId: string): Promise<BranchOrmEntity | null>;
  abstract findAll(companyId: string | null, query: PaginationQueryDto): Promise<Page<BranchOrmEntity>>;
  abstract update(id: string, data: Partial<BranchOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class BranchRepositoryImpl implements BranchRepository {
  constructor(
    @InjectRepository(BranchOrmEntity)
    private readonly repo: Repository<BranchOrmEntity>,
  ) {}

  create(data: Partial<BranchOrmEntity>): Promise<BranchOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string | null): Promise<BranchOrmEntity | null> {
    return this.repo.findOne({ where: companyId ? { id, companyId } : { id } });
  }

  findByCode(code: string, companyId: string): Promise<BranchOrmEntity | null> {
    return this.repo.findOne({ where: { code, companyId } });
  }

  async findAll(companyId: string | null, query: PaginationQueryDto): Promise<Page<BranchOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('b')
      .orderBy('b.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (companyId) qb.where('b.companyId = :companyId', { companyId });
    if (search) qb.andWhere('b.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<BranchOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
