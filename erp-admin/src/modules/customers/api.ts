import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta, PaginationQuery } from '@/shared/types/api.types';
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from './types';

export const customerApi = {
  getAll: (params?: PaginationQuery) =>
    client.get<ApiResponse<Customer[]>>(API.customers, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Customer>>(API.customer(id)).then((r) => r.data.data),

  create: (payload: CreateCustomerPayload) =>
    client.post<ApiResponse<Customer>>(API.customers, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateCustomerPayload) =>
    client.patch<ApiResponse<Customer>>(API.customer(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.customer(id)),
};
