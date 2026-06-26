import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from './types';

export const categoryApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<Category[]>>(API.categories, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getTree: () =>
    client.get<ApiResponse<Category[]>>(API.categoryTree).then((r) => r.data.data),

  getById: (id: string) =>
    client.get<ApiResponse<Category>>(API.category(id)).then((r) => r.data.data),

  create: (payload: CreateCategoryPayload) =>
    client.post<ApiResponse<Category>>(API.categories, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateCategoryPayload) =>
    client.patch<ApiResponse<Category>>(API.category(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.category(id)),
};
