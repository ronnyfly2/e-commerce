import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Currency, CreateCurrencyPayload, UpdateCurrencyPayload } from './types';

export const currencyApi = {
  getAll: () =>
    client.get<ApiResponse<Currency[]>>(API.currencies).then((r) => r.data.data),

  create: (payload: CreateCurrencyPayload) =>
    client.post<ApiResponse<Currency>>(API.currencies, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateCurrencyPayload) =>
    client.patch<ApiResponse<Currency>>(API.currency(id), payload).then((r) => r.data.data),

  setDefault: (id: string) =>
    client.patch<ApiResponse<Currency>>(API.currencyDefault(id)).then((r) => r.data.data),
};
