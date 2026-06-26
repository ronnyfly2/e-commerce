import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Role, CreateRolePayload, UpdateRolePayload } from './types';

export const roleApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<Role[]>>(API.roles, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Role>>(API.role(id)).then((r) => r.data.data),

  create: (payload: CreateRolePayload) =>
    client.post<ApiResponse<Role>>(API.roles, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateRolePayload) =>
    client.patch<ApiResponse<Role>>(API.role(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.role(id)),
};
