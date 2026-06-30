import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyOrmEntity } from './currency.orm-entity';

export abstract class CurrencyRepository {
  abstract findAll(): Promise<CurrencyOrmEntity[]>;
  abstract findById(id: string): Promise<CurrencyOrmEntity | null>;
  abstract findByCode(code: string): Promise<CurrencyOrmEntity | null>;
  abstract findDefault(): Promise<CurrencyOrmEntity | null>;
  abstract create(data: Partial<CurrencyOrmEntity>): Promise<CurrencyOrmEntity>;
  abstract update(id: string, data: Partial<CurrencyOrmEntity>): Promise<void>;
  abstract clearDefault(): Promise<void>;
}

@Injectable()
export class CurrencyRepositoryImpl implements CurrencyRepository {
  constructor(
    @InjectRepository(CurrencyOrmEntity)
    private readonly repo: Repository<CurrencyOrmEntity>,
  ) {}

  findAll(): Promise<CurrencyOrmEntity[]> {
    return this.repo.find({ order: { isDefault: 'DESC', code: 'ASC' } });
  }

  findById(id: string): Promise<CurrencyOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<CurrencyOrmEntity | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase() } });
  }

  findDefault(): Promise<CurrencyOrmEntity | null> {
    return this.repo.findOne({ where: { isDefault: true } });
  }

  create(data: Partial<CurrencyOrmEntity>): Promise<CurrencyOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<CurrencyOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async clearDefault(): Promise<void> {
    await this.repo.update({ isDefault: true }, { isDefault: false });
  }
}
