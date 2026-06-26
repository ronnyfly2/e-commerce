export interface Brand {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandPayload {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}

export type UpdateBrandPayload = Partial<CreateBrandPayload & { isActive: boolean }>;
