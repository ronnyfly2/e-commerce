import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '@/shared/infrastructure/decorators/public.decorator';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../strategies/jwt.strategy';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginDto } from '../../application/dtos/login.dto';

class RefreshDto {
  refreshToken: string;
}

class LogoutDto {
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email + password login' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.loginUseCase.execute(dto, {
      ip: req.ip,
      device: req.headers['user-agent'],
    });

    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access + refresh tokens' })
  async refresh(@Body() body: RefreshDto) {
    const result = await this.refreshTokenUseCase.execute(body.refreshToken);
    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() body: LogoutDto) {
    await this.logoutUseCase.execute(body.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all sessions for current user' })
  async logoutAll(@CurrentUser('sub') userId: string) {
    await this.logoutUseCase.revokeAll(userId);
  }
}
