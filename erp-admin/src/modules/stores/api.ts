import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Store, CreateStorePayload, UpdateStorePayload } from './types';

export const storeApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<Store[]>>(API.stores, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Store>>(API.store(id)).then((r) => r.data.data),

  create: (payload: CreateStorePayload) =>
    client.post<ApiResponse<Store>>(API.stores, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateStorePayload) =>
    client.patch<ApiResponse<Store>>(API.store(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.store(id)),
};
