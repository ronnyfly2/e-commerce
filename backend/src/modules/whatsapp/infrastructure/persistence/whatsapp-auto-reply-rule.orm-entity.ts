import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';

/** A simple keyword → canned-reply rule, matched case-insensitively as a substring of the incoming message. */
@Entity('whatsapp_auto_reply_rules')
export class WhatsAppAutoReplyRuleOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 255 })
  keyword: string;

  @Column({ name: 'reply_text', type: 'text' })
  replyText: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
