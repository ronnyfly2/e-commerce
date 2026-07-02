export interface ProductPriceTier {
  id: string;
  companyId: string;
  productId: string;
  minQuantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPriceTierPayload {
  productId: string;
  minQuantity: number;
  price: number;
}

export type UpdateProductPriceTierPayload = Partial<Omit<CreateProductPriceTierPayload, 'productId'>>;
