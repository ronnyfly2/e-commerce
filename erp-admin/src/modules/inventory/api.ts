import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { ProductStock } from './types';

export const inventoryApi = {
  getByProduct: (productId: string) =>
    client.get<ApiResponse<ProductStock[]>>(API.productStocks(productId)).then((r) => r.data.data),

  updateQuantity: (id: string, quantity: number) =>
    client.patch<ApiResponse<ProductStock>>(API.productStock(id), { quantity }).then((r) => r.data.data),
};
