export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload & { isActive: boolean }>;
