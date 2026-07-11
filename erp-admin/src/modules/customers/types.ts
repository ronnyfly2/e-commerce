import type { PaginationMeta } from '@/shared/types/api.types';

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
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export type PointsTransactionType = 'MANUAL' | 'PURCHASE' | 'REVERSAL' | 'RAFFLE_ENTRY';

export interface PointsTransaction {
  id: string;
  customerId: string;
  type: PointsTransactionType;
  points: number;
  reason: string | null;
  orderId: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface CustomerPoints {
  balance: number;
  transactions: { items: PointsTransaction[]; meta: PaginationMeta };
}

export interface AdjustPointsPayload {
  points: number;
  reason: string;
}

export const POINTS_TRANSACTION_TYPE_LABELS: Record<PointsTransactionType, string> = {
  MANUAL: 'Ajuste manual',
  PURCHASE: 'Compra',
  REVERSAL: 'Reversión',
  RAFFLE_ENTRY: 'Entrada a sorteo',
};

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
