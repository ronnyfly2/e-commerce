import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { User, CreateUserPayload, UpdateUserPayload } from './types';

export const userApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<User[]>>(API.users, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<User>>(API.user(id)).then((r) => r.data.data),

  create: (payload: CreateUserPayload) =>
    client.post<ApiResponse<User>>(API.users, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateUserPayload) =>
    client.patch<ApiResponse<User>>(API.user(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.user(id)),
};
