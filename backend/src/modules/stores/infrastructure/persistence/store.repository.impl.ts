import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreOrmEntity } from './store.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class StoreRepository {
  abstract create(data: Partial<StoreOrmEntity>): Promise<StoreOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<StoreOrmEntity | null>;
  abstract findByCode(code: string, companyId: string): Promise<StoreOrmEntity | null>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<StoreOrmEntity>>;
  abstract update(id: string, data: Partial<StoreOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class StoreRepositoryImpl implements StoreRepository {
  constructor(
    @InjectRepository(StoreOrmEntity)
    private readonly repo: Repository<StoreOrmEntity>,
  ) {}

  create(data: Partial<StoreOrmEntity>): Promise<StoreOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<StoreOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId }, relations: { branch: true } });
  }

  findByCode(code: string, companyId: string): Promise<StoreOrmEntity | null> {
    return this.repo.findOne({ where: { code, companyId } });
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<StoreOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.branch', 'branch')
      .where('s.companyId = :companyId', { companyId })
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) qb.andWhere('s.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<StoreOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
