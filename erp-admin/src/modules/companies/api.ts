import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Company, CreateCompanyPayload, UpdateCompanyPayload } from './types';

export const companyApi = {
  getAll: (params?: PaginationQuery) =>
    client
      .get<ApiResponse<Company[]>>(API.companies, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Company>>(API.company(id)).then((r) => r.data.data),

  create: (payload: CreateCompanyPayload) =>
    client.post<ApiResponse<Company>>(API.companies, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateCompanyPayload) =>
    client.patch<ApiResponse<Company>>(API.company(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.company(id)),
};
