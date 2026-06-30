import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Result, ok, err } from '@/shared/domain/result';
import { Permission } from '@/shared/domain/permission.enum';
import { UserRepository } from '../../infrastructure/persistence/user.repository.impl';
import { RefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository.impl';
import { LoginDto } from '../dtos/login.dto';
import { TokenResponseDto } from '../dtos/token-response.dto';
import {
  InvalidCredentialsError,
  UserInactiveError,
} from '../../domain/errors/auth.errors';

type LoginError = InvalidCredentialsError | UserInactiveError;

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    dto: LoginDto,
    meta?: { ip?: string; device?: string },
  ): Promise<Result<TokenResponseDto, LoginError>> {
    const user = await this.userRepo.findByEmail(dto.email);

    if (!user) return err(new InvalidCredentialsError());

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) return err(new InvalidCredentialsError());

    if (!user.isActive) return err(new UserInactiveError());

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

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshExpiresIn);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      ip: meta?.ip,
      device: meta?.device,
    });

    await this.userRepo.updateLastLogin(user.id);

    return ok({
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60,
    });
  }
}
