export const PRODUCT_UNITS = [
  { value: 'unit', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'l', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (mL)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'pair', label: 'Par' },
  { value: 'box', label: 'Caja' },
  { value: 'pack', label: 'Paquete' },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]['value'];

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
  color: string | null;
  weight: number | null;
  unit: ProductUnit;
  imageUrl: string | null;
  images: string[] | null;
  isActive: boolean;
  /** Loyalty points credited per unit purchased once the order's payment is marked PAID. */
  pointsAwarded: number;
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
  color?: string;
  weight?: number;
  unit?: ProductUnit;
  categoryId?: string;
  brandId?: string;
  imageUrl?: string;
  pointsAwarded?: number;
}

export type UpdateProductPayload = Partial<CreateProductPayload & { isActive: boolean }>;
