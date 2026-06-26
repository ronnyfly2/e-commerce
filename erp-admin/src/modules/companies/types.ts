export interface Company {
  id: string;
  name: string;
  slug: string;
  ruc: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  slug: string;
  ruc: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload & { isActive: boolean }>;
