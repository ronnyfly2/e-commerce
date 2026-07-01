export interface ProductStock {
  id: string;
  companyId: string;
  productId: string;
  storeId: string;
  quantity: number;
  store?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
