import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class StaffUserRepository {
  abstract create(data: Partial<UserOrmEntity>): Promise<UserOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<UserOrmEntity | null>;
  abstract findByEmail(email: string): Promise<UserOrmEntity | null>;
  abstract findAll(companyId: string, query: PaginationQueryDto): Promise<Page<UserOrmEntity>>;
  abstract update(id: string, data: Partial<UserOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class StaffUserRepositoryImpl implements StaffUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  create(data: Partial<UserOrmEntity>): Promise<UserOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<UserOrmEntity | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: { role: true },
    });
  }

  findByEmail(email: string): Promise<UserOrmEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findAll(companyId: string, query: PaginationQueryDto): Promise<Page<UserOrmEntity>> {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.companyId = :companyId', { companyId })
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) {
      qb.andWhere(
        '(u.firstName ILIKE :s OR u.lastName ILIKE :s OR u.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: Partial<UserOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
