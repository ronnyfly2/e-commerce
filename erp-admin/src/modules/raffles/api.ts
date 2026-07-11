import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse, PaginationMeta } from '@/shared/types/api.types';
import type {
  Raffle,
  CreateRafflePayload,
  UpdateRafflePayload,
  RaffleFilters,
  RaffleStatus,
  EligiblePreview,
  UpdatePrizeStatusPayload,
} from './types';

export const raffleApi = {
  getAll: (params?: RaffleFilters) =>
    client.get<ApiResponse<Raffle[]>>(API.raffles, { params })
      .then((r) => ({ items: r.data.data, meta: r.data.meta as PaginationMeta })),

  getById: (id: string) =>
    client.get<ApiResponse<Raffle>>(API.raffle(id)).then((r) => r.data.data),

  create: (payload: CreateRafflePayload) =>
    client.post<ApiResponse<Raffle>>(API.raffles, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateRafflePayload) =>
    client.patch<ApiResponse<Raffle>>(API.raffle(id), payload).then((r) => r.data.data),

  updateStatus: (id: string, status: RaffleStatus) =>
    client.patch<ApiResponse<Raffle>>(API.raffleStatus(id), { status }).then((r) => r.data.data),

  getEligible: (id: string) =>
    client.get<ApiResponse<EligiblePreview>>(API.raffleEligible(id)).then((r) => r.data.data),

  draw: (id: string) =>
    client.post<ApiResponse<Raffle>>(API.raffleDraw(id)).then((r) => r.data.data),

  updatePrizeStatus: (id: string, payload: UpdatePrizeStatusPayload) =>
    client.patch<ApiResponse<Raffle>>(API.rafflePrize(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.raffle(id)),
};
