import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class RoleRepository {
  abstract create(data: Partial<RoleOrmEntity>): Promise<RoleOrmEntity>;
  abstract findById(id: string): Promise<RoleOrmEntity | null>;
  abstract findByName(name: string, companyId: string | null): Promise<RoleOrmEntity | null>;
  abstract findAll(companyId: string | null, query: PaginationQueryDto): Promise<Page<RoleOrmEntity>>;
  abstract update(id: string, data: Partial<RoleOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class RoleRepositoryImpl implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repo: Repository<RoleOrmEntity>,
  ) {}

  create(data: Partial<RoleOrmEntity>): Promise<RoleOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string): Promise<RoleOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string, companyId: string | null): Promise<RoleOrmEntity | null> {
    return this.repo.findOne({ where: { name, companyId: companyId ?? undefined } });
  }

  async findAll(
    companyId: string | null,
    query: PaginationQueryDto,
  ): Promise<Page<RoleOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('r')
      .where('(r.companyId = :companyId OR r.isSystem = true)', { companyId })
      .orderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) qb.andWhere('r.name ILIKE :s', { s: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<RoleOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
