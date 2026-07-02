import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  ProductPriceTier,
  CreateProductPriceTierPayload,
  UpdateProductPriceTierPayload,
} from './types';

export const productPriceTierApi = {
  getByProduct: (productId: string) =>
    client.get<ApiResponse<ProductPriceTier[]>>(API.productPriceTiersByProduct(productId)).then((r) => r.data.data),

  create: (payload: CreateProductPriceTierPayload) =>
    client.post<ApiResponse<ProductPriceTier>>(API.productPriceTiers, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateProductPriceTierPayload) =>
    client.patch<ApiResponse<ProductPriceTier>>(API.productPriceTier(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.productPriceTier(id)),
};
