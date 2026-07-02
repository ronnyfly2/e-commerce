import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { WhatsAppDirection } from '../../domain/whatsapp-direction.enum';

@Entity('whatsapp_messages')
export class WhatsAppMessageOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'enum', enum: WhatsAppDirection })
  direction: WhatsAppDirection;

  @Column({ type: 'text' })
  body: string;

  /** Meta's message id (wamid...) — used to correlate delivery-status webhook updates. */
  @Index()
  @Column({ name: 'wa_message_id', type: 'varchar', length: 100, nullable: true })
  waMessageId: string | null;

  /** sent | delivered | read | failed — only meaningful for OUT messages. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string | null;

  @Column({ name: 'auto_replied', default: false })
  autoReplied: boolean;

  @ManyToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;
}
