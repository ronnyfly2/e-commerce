import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class WhatsAppNotConfiguredError extends DomainError {
  constructor() {
    super(
      'WHATSAPP_NOT_CONFIGURED',
      'WhatsApp is not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN (see docs/whatsapp-meta-setup.md)',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AutoReplyRuleNotFoundError extends DomainError {
  constructor(id: string) {
    super('AUTO_REPLY_RULE_NOT_FOUND', `Auto-reply rule ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
