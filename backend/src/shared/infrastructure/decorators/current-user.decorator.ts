import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (
    field: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();
    return field ? request.user[field] : request.user;
  },
);
