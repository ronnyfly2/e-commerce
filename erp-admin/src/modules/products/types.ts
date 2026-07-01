export interface Product {
  id: string;
  companyId: string;
  categoryId: string | null;
  brandId: string | null;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  /** Denormalized total — sum of per-store quantities, synced server-side on every inventory adjustment. */
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string | null;
  images: string[] | null;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  minStock?: number;
  unit?: string;
  categoryId?: string;
  brandId?: string;
  imageUrl?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload & { isActive: boolean }>;
