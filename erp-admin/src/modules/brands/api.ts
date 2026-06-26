import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Brand, CreateBrandPayload, UpdateBrandPayload } from './types';

export const brandApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<Brand[]>>(API.brands, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Brand>>(API.brand(id)).then((r) => r.data.data),

  create: (payload: CreateBrandPayload) =>
    client.post<ApiResponse<Brand>>(API.brands, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateBrandPayload) =>
    client.patch<ApiResponse<Brand>>(API.brand(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.brand(id)),
};
