export interface ProductFeature {
  id: string;
  companyId: string;
  productId: string;
  name: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductFeaturePayload {
  productId: string;
  name: string;
  value: string;
  sortOrder?: number;
}

export type UpdateProductFeaturePayload = Partial<Omit<CreateProductFeaturePayload, 'productId'>>;
