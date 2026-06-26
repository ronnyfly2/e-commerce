export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiError {
  error: { code: string; message: string };
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

export function extractApiError(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err
  ) {
    const response = (err as { response?: { data?: ApiError } }).response;
    if (response?.data?.error?.message) {
      return response.data.error.message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
