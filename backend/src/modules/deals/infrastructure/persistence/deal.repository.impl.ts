import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DealOrmEntity } from './deal.orm-entity';

export abstract class DealRepository {
  abstract create(data: Partial<DealOrmEntity>): Promise<DealOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<DealOrmEntity | null>;
  abstract findByCustomer(customerId: string, companyId: string): Promise<DealOrmEntity[]>;
  /** Unpaginated — the pipeline board renders every open deal grouped by stage on one screen. */
  abstract findAll(companyId: string): Promise<DealOrmEntity[]>;
  abstract update(id: string, data: Partial<DealOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class DealRepositoryImpl implements DealRepository {
  constructor(
    @InjectRepository(DealOrmEntity)
    private readonly repo: Repository<DealOrmEntity>,
  ) {}

  create(data: Partial<DealOrmEntity>): Promise<DealOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<DealOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId }, relations: { customer: true } });
  }

  findByCustomer(customerId: string, companyId: string): Promise<DealOrmEntity[]> {
    return this.repo.find({ where: { customerId, companyId }, order: { createdAt: 'DESC' } });
  }

  findAll(companyId: string): Promise<DealOrmEntity[]> {
    return this.repo.find({
      where: { companyId },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<DealOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
