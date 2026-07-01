export interface Store {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
}

export type UpdateStorePayload = Partial<CreateStorePayload & { isActive: boolean }>;
