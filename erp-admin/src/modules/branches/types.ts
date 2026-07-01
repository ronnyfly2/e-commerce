export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Super-admin only — picks the target company; ignored for regular users */
  companyId?: string;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload & { isActive: boolean }>;
