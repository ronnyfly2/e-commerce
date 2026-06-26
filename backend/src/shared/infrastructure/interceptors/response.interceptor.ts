import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Page } from '@/shared/domain/pagination';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        const timestamp = new Date().toISOString();

        if (result === null || result === undefined) {
          return { data: null, timestamp };
        }

        if (isPage(result)) {
          return { data: result.items, meta: result.meta, timestamp };
        }

        return { data: result, timestamp };
      }),
    );
  }
}

function isPage(value: unknown): value is Page<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'meta' in value &&
    Array.isArray((value as Page<unknown>).items)
  );
}
