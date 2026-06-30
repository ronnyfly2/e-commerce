import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta } from '@/shared/types/api.types';
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  UpdatePaymentStatusPayload,
  OrderFilters,
} from './types';

export const orderApi = {
  getAll: (params?: OrderFilters) =>
    client
      .get<ApiResponse<Order[]>>(API.orders, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Order>>(API.order(id)).then((r) => r.data.data),

  create: (payload: CreateOrderPayload) =>
    client.post<ApiResponse<Order>>(API.orders, payload).then((r) => r.data.data),

  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    client.patch<ApiResponse<Order>>(API.orderStatus(id), payload).then((r) => r.data.data),

  updatePaymentStatus: (id: string, payload: UpdatePaymentStatusPayload) =>
    client.patch<ApiResponse<Order>>(API.orderPaymentStatus(id), payload).then((r) => r.data.data),

  cancel: (id: string) => client.delete(API.order(id)),
};
