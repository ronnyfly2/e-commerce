export type CustomerSource = 'manual' | 'whatsapp';

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  source: CustomerSource;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload & { isActive: boolean }>;

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  manual: 'Manual',
  whatsapp: 'WhatsApp',
};
