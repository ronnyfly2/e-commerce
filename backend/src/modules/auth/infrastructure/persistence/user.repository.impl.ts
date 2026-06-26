import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<UserOrmEntity | null>;
  abstract findById(id: string): Promise<UserOrmEntity | null>;
  abstract updateLastLogin(id: string): Promise<void>;
}

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  findByEmail(email: string): Promise<UserOrmEntity | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.email = :email', { email })
      .andWhere('u.deletedAt IS NULL')
      .getOne();
  }

  findById(id: string): Promise<UserOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }
}
