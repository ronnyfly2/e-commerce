import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Product, CreateProductPayload, UpdateProductPayload } from './types';

export interface ProductQuery extends PaginationQuery {
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}

export const productApi = {
  getAll: (params?: ProductQuery) =>
    client.get<ApiResponse<Product[]>>(API.products, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Product>>(API.product(id)).then((r) => r.data.data),

  create: (payload: CreateProductPayload) =>
    client.post<ApiResponse<Product>>(API.products, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateProductPayload) =>
    client.patch<ApiResponse<Product>>(API.product(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.product(id)),
};
