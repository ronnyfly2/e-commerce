import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Deal, CreateDealPayload, UpdateDealPayload, DealStage } from './types';

export const dealApi = {
  getAll: () => client.get<ApiResponse<Deal[]>>(API.deals).then((r) => r.data.data),

  getById: (id: string) => client.get<ApiResponse<Deal>>(API.deal(id)).then((r) => r.data.data),

  create: (payload: CreateDealPayload) =>
    client.post<ApiResponse<Deal>>(API.deals, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateDealPayload) =>
    client.patch<ApiResponse<Deal>>(API.deal(id), payload).then((r) => r.data.data),

  updateStage: (id: string, stage: DealStage) =>
    client.patch<ApiResponse<Deal>>(API.dealStage(id), { stage }).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.deal(id)),
};
