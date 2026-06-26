export interface User {
  id: string;
  companyId: string | null;
  roleId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  role?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'email'> & { isActive: boolean }>;
