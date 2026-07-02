import { Injectable } from '@nestjs/common';
import { WhatsAppResponder } from '../../domain/whatsapp-responder.interface';
import { WhatsAppAutoReplyRuleRepository } from '../persistence/whatsapp-auto-reply-rule.repository.impl';

/** MVP `WhatsAppResponder`: matches the incoming text against keyword rules configured in the CRM. */
@Injectable()
export class KeywordAutoResponder implements WhatsAppResponder {
  constructor(private readonly ruleRepo: WhatsAppAutoReplyRuleRepository) {}

  async getReply(incomingText: string, companyId: string): Promise<string | null> {
    const rules = await this.ruleRepo.findActiveByCompany(companyId);
    const lower = incomingText.toLowerCase();
    const match = rules.find((r) => lower.includes(r.keyword.toLowerCase()));
    return match?.replyText ?? null;
  }
}
