/**
 * A pluggable strategy for deciding how to auto-reply to an inbound WhatsApp message.
 *
 * Today the only binding is `KeywordAutoResponder` (simple substring rule matching, managed
 * from the CRM UI). To upgrade to an AI-driven bot later, implement this same interface
 * (e.g. `AiAutoResponder` backed by an LLM) and swap the provider binding in
 * `whatsapp.module.ts` — nothing in the webhook or message-persistence code needs to change.
 */
export abstract class WhatsAppResponder {
  /** Returns the reply text to send back, or null to stay silent (a human should answer). */
  abstract getReply(incomingText: string, companyId: string, customerId: string): Promise<string | null>;
}
