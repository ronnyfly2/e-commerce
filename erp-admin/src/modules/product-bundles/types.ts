export interface ProductBundleItem {
  id: string;
  bundleId: string;
  productId: string;
  quantity: number;
  product?: { id: string; name: string; sku: string };
}

export interface ProductBundle {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  items: ProductBundleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateProductBundlePayload {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  items: BundleItemInput[];
}

export type UpdateProductBundlePayload = Partial<CreateProductBundlePayload & { isActive: boolean }>;
