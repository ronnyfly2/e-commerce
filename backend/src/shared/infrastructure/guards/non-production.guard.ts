import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

/** Blocks a route outright when NODE_ENV=production, regardless of caller permissions —
 * a code-level safety net for destructive dev/staging-only tools (seed runner, DB wipe). */
@Injectable()
export class NonProductionGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException({ code: 'DEV_TOOLS_DISABLED', message: 'Not available in production' });
    }
    return true;
  }
}
