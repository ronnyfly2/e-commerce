import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { RefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository.impl';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (stored) await this.refreshTokenRepo.revokeById(stored.id);
  }

  async revokeAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }
}
