import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';

export abstract class RefreshTokenRepository {
  abstract create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    device?: string;
    ip?: string;
  }): Promise<RefreshTokenOrmEntity>;

  abstract findValidByHash(tokenHash: string): Promise<RefreshTokenOrmEntity | null>;
  abstract revokeById(id: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}

@Injectable()
export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    device?: string;
    ip?: string;
  }): Promise<RefreshTokenOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findValidByHash(tokenHash: string): Promise<RefreshTokenOrmEntity | null> {
    return this.repo.findOne({
      where: { tokenHash, revokedAt: undefined },
      relations: ['user', 'user.role'],
    });
  }

  async revokeById(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }
}
