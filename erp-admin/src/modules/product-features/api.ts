import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { ProductFeature, CreateProductFeaturePayload, UpdateProductFeaturePayload } from './types';

export const productFeatureApi = {
  getByProduct: (productId: string) =>
    client.get<ApiResponse<ProductFeature[]>>(API.productFeaturesByProduct(productId)).then((r) => r.data.data),

  create: (payload: CreateProductFeaturePayload) =>
    client.post<ApiResponse<ProductFeature>>(API.productFeatures, payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateProductFeaturePayload) =>
    client.patch<ApiResponse<ProductFeature>>(API.productFeature(id), payload).then((r) => r.data.data),

  remove: (id: string) => client.delete(API.productFeature(id)),
};
