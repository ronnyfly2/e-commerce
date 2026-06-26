import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from './types';

export const branchApi = {
  getAll: (params?: PaginationQuery) =>
    client
      .get<ApiResponse<Branch[]>>(API.branches, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Branch>>(API.branch(id)).then((r) => r.data.data),

  create: (payload: CreateBranchPayload) =>
    client.post<ApiResponse<Branch>>(API.branches, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateBranchPayload) =>
    client.patch<ApiResponse<Branch>>(API.branch(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.branch(id)),
};
