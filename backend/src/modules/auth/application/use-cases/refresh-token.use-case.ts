import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Result, ok, err } from '@/shared/domain/result';
import { Permission } from '@/shared/domain/permission.enum';
import { RefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository.impl';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    rawToken: string,
  ): Promise<Result<TokenResponseDto, InvalidRefreshTokenError>> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return err(new InvalidRefreshTokenError());
    }

    // Rotate: revoke old, issue new
    await this.refreshTokenRepo.revokeById(stored.id);

    const user = stored.user;
    const rolePermissions: Permission[] = user.role?.permissions ?? [];
    const extraPermissions: Permission[] = user.additionalPermissions ?? [];
    const permissions = [...new Set([...rolePermissions, ...extraPermissions])];

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    const privateKey = Buffer.from(
      this.config.getOrThrow<string>('JWT_PRIVATE_KEY_BASE64'),
      'base64',
    ).toString();

    const accessToken = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });

    const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRawRefreshToken)
      .digest('hex');

    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000;
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + refreshExpiresIn),
      ip: stored.ip ?? undefined,
      device: stored.device ?? undefined,
    });

    return ok({
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 15 * 60,
    });
  }
}
