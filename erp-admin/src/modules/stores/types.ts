export interface Store {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  branch?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorePayload {
  branchId: string;
  name: string;
  code: string;
  address?: string;
}

export type UpdateStorePayload = Partial<CreateStorePayload & { isActive: boolean }>;
