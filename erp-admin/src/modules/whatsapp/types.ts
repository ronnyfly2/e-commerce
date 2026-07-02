export type WhatsAppDirection = 'in' | 'out';

export interface WhatsAppMessage {
  id: string;
  companyId: string;
  customerId: string;
  direction: WhatsAppDirection;
  body: string;
  waMessageId: string | null;
  status: string | null;
  autoReplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutoReplyRule {
  id: string;
  companyId: string;
  keyword: string;
  replyText: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoReplyRulePayload {
  keyword: string;
  replyText: string;
  sortOrder?: number;
}

export type UpdateAutoReplyRulePayload = Partial<CreateAutoReplyRulePayload & { isActive: boolean }>;
