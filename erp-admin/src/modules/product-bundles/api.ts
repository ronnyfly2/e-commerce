import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { ProductBundle, CreateProductBundlePayload, UpdateProductBundlePayload } from './types';

export const productBundleApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<ProductBundle[]>>(API.productBundles, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<ProductBundle>>(API.productBundle(id)).then((r) => r.data.data),

  create: (payload: CreateProductBundlePayload) =>
    client.post<ApiResponse<ProductBundle>>(API.productBundles, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateProductBundlePayload) =>
    client.patch<ApiResponse<ProductBundle>>(API.productBundle(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.productBundle(id)),
};
