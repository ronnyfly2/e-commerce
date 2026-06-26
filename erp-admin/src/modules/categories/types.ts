export interface Category {
  id: string;
  companyId: string;
  parentId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload & { isActive: boolean }>;
