import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '@/modules/customers/customers.module';
import { WhatsAppMessageOrmEntity } from './infrastructure/persistence/whatsapp-message.orm-entity';
import { WhatsAppAutoReplyRuleOrmEntity } from './infrastructure/persistence/whatsapp-auto-reply-rule.orm-entity';
import {
  WhatsAppMessageRepository,
  WhatsAppMessageRepositoryImpl,
} from './infrastructure/persistence/whatsapp-message.repository.impl';
import {
  WhatsAppAutoReplyRuleRepository,
  WhatsAppAutoReplyRuleRepositoryImpl,
} from './infrastructure/persistence/whatsapp-auto-reply-rule.repository.impl';
import { WhatsAppGraphClient } from './infrastructure/services/whatsapp-graph-client.service';
import { KeywordAutoResponder } from './infrastructure/services/keyword-auto-responder.service';
import { WhatsAppResponder } from './domain/whatsapp-responder.interface';
import { WhatsAppWebhookController } from './infrastructure/http/whatsapp-webhook.controller';
import { WhatsAppController } from './infrastructure/http/whatsapp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppMessageOrmEntity, WhatsAppAutoReplyRuleOrmEntity]),
    CustomersModule,
  ],
  controllers: [WhatsAppWebhookController, WhatsAppController],
  providers: [
    { provide: WhatsAppMessageRepository, useClass: WhatsAppMessageRepositoryImpl },
    { provide: WhatsAppAutoReplyRuleRepository, useClass: WhatsAppAutoReplyRuleRepositoryImpl },
    WhatsAppGraphClient,
    // Swap this binding for an AI-backed implementation later — see WhatsAppResponder.
    { provide: WhatsAppResponder, useClass: KeywordAutoResponder },
  ],
  exports: [WhatsAppMessageRepository],
})
export class WhatsAppModule {}
