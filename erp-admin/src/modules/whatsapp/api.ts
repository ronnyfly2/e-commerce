import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  WhatsAppMessage,
  AutoReplyRule,
  CreateAutoReplyRulePayload,
  UpdateAutoReplyRulePayload,
} from './types';

export const whatsappApi = {
  getMessages: (customerId: string) =>
    client.get<ApiResponse<WhatsAppMessage[]>>(API.whatsappMessages(customerId)).then((r) => r.data.data),

  sendMessage: (customerId: string, body: string) =>
    client.post<ApiResponse<WhatsAppMessage>>(API.whatsappMessages(customerId), { body }).then((r) => r.data.data),

  getRules: () =>
    client.get<ApiResponse<AutoReplyRule[]>>(API.whatsappRules).then((r) => r.data.data),

  createRule: (payload: CreateAutoReplyRulePayload) =>
    client.post<ApiResponse<AutoReplyRule>>(API.whatsappRules, payload).then((r) => r.data.data),

  updateRule: (id: string, payload: UpdateAutoReplyRulePayload) =>
    client.patch<ApiResponse<AutoReplyRule>>(API.whatsappRule(id), payload).then((r) => r.data.data),

  removeRule: (id: string) => client.delete(API.whatsappRule(id)),
};
