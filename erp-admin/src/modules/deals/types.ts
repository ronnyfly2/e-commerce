export type DealStage = 'new' | 'contacted' | 'negotiating' | 'won' | 'lost';

export interface Deal {
  id: string;
  companyId: string;
  customerId: string;
  customer?: { id: string; name: string; phone: string };
  title: string;
  stage: DealStage;
  value: number | null;
  currencyCode: string;
  notes: string | null;
  assignedToId: string | null;
  expectedCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealPayload {
  customerId: string;
  title: string;
  stage?: DealStage;
  value?: number;
  currencyCode?: string;
  notes?: string;
  assignedToId?: string;
  expectedCloseDate?: string;
}

export type UpdateDealPayload = Partial<Omit<CreateDealPayload, 'customerId'>>;

export const DEAL_STAGES: DealStage[] = ['new', 'contacted', 'negotiating', 'won', 'lost'];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  negotiating: 'Negociando',
  won: 'Ganado',
  lost: 'Perdido',
};
