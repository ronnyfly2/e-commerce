import type { Permission } from '@/modules/auth/types';

export interface Role {
  id: string;
  companyId: string | null;
  name: string;
  description: string | null;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: Permission[];
}

export type UpdateRolePayload = Partial<CreateRolePayload>;
