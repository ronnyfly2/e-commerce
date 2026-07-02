import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOrmEntity } from './customer.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class CustomerRepository {
  abstract create(data: Partial<CustomerOrmEntity>): Promise<CustomerOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<CustomerOrmEntity | null>;
  abstract findByPhone(phone: string, companyId: string): Promise<CustomerOrmEntity | null>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<CustomerOrmEntity>>;
  abstract update(id: string, data: Partial<CustomerOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class CustomerRepositoryImpl implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  create(data: Partial<CustomerOrmEntity>): Promise<CustomerOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<CustomerOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  findByPhone(phone: string, companyId: string): Promise<CustomerOrmEntity | null> {
    return this.repo.findOne({ where: { phone, companyId } });
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<CustomerOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.companyId = :companyId', { companyId })
      .orderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) {
      qb.andWhere('(c.name ILIKE :s OR c.phone ILIKE :s OR c.email ILIKE :s)', { s: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<CustomerOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
