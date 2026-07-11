import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';

/** Restricts a route to platform super-admins — stricter than PermissionsGuard, which any
 * fully-permissioned company Administrador could otherwise satisfy. Use for cross-tenant/destructive tools. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Requires super-admin' });
    }
    return true;
  }
}
