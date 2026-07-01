export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiError {
  error: { code: string; message: string | string[] };
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export function extractApiErrorList(err: unknown): string[] {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const body = (err as { response?: { data?: ApiError } }).response?.data?.error;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message : [body.message];
    }
  }
  if (err instanceof Error) return [err.message];
  return ['Error inesperado'];
}

export function extractApiError(err: unknown): string {
  return extractApiErrorList(err).join('\n');
}
