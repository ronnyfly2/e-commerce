import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/refresh-token.orm-entity';
import {
  UserRepository,
  UserRepositoryImpl,
} from './infrastructure/persistence/user.repository.impl';
import {
  RefreshTokenRepository,
  RefreshTokenRepositoryImpl,
} from './infrastructure/persistence/refresh-token.repository.impl';

import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';

import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';

import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, RefreshTokenOrmEntity]),
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: RefreshTokenRepository, useClass: RefreshTokenRepositoryImpl },
    JwtStrategy,
    JwtRefreshStrategy,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  exports: [UserRepository],
})
export class AuthModule {}
