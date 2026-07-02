import {
  Controller, Get, Post, Query, Headers, Req, Res, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { Public } from '@/shared/infrastructure/decorators/public.decorator';
import { CustomerRepository } from '@/modules/customers/infrastructure/persistence/customer.repository.impl';
import { CustomerSource } from '@/modules/customers/domain/customer-source.enum';
import { WhatsAppMessageRepository } from '../persistence/whatsapp-message.repository.impl';
import { WhatsAppResponder } from '../../domain/whatsapp-responder.interface';
import { WhatsAppGraphClient } from '../services/whatsapp-graph-client.service';
import { WhatsAppDirection } from '../../domain/whatsapp-direction.enum';
import type { WhatsAppIncomingMessage, WhatsAppWebhookPayload } from './whatsapp-webhook.types';

/** Receives events from Meta — must stay public (no JWT) since Meta calls it directly. Protected instead
 * by the hub.verify_token handshake (GET) and an HMAC signature check on every payload (POST). */
@ApiExcludeController()
@Public()
@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly customerRepo: CustomerRepository,
    private readonly messageRepo: WhatsAppMessageRepository,
    private readonly responder: WhatsAppResponder,
    private readonly graphClient: WhatsAppGraphClient,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const expected = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected) {
      res.status(HttpStatus.OK).send(challenge);
      return;
    }
    res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<{ received: true }> {
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (appSecret) {
      if (!req.rawBody || !this.hasValidSignature(req.rawBody, signature, appSecret)) {
        this.logger.warn('Rejected WhatsApp webhook payload with invalid signature');
        return { received: true }; // 200 regardless — Meta retries aggressively on non-2xx
      }
    } else {
      this.logger.warn('WHATSAPP_APP_SECRET not set — skipping webhook signature verification');
    }

    const companyId = this.config.get<string>('WHATSAPP_COMPANY_ID');
    if (!companyId) {
      this.logger.warn('WHATSAPP_COMPANY_ID not set — ignoring inbound WhatsApp webhook');
      return { received: true };
    }

    const payload = req.body as WhatsAppWebhookPayload;
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const profileName = change.value?.contacts?.[0]?.profile?.name;
        for (const message of change.value?.messages ?? []) {
          await this.handleIncomingMessage(message, profileName, companyId);
        }
        for (const status of change.value?.statuses ?? []) {
          await this.messageRepo.updateStatusByWaMessageId(status.id, status.status);
        }
      }
    }

    return { received: true };
  }

  private async handleIncomingMessage(
    message: WhatsAppIncomingMessage,
    profileName: string | undefined,
    companyId: string,
  ): Promise<void> {
    if (message.type !== 'text' || !message.text) return; // MVP: text messages only

    let customer = await this.customerRepo.findByPhone(message.from, companyId);
    if (!customer) {
      customer = await this.customerRepo.create({
        companyId,
        phone: message.from,
        name: profileName || message.from,
        source: CustomerSource.WHATSAPP,
      });
    }

    await this.messageRepo.create({
      companyId,
      customerId: customer.id,
      direction: WhatsAppDirection.IN,
      body: message.text.body,
      waMessageId: message.id,
    });

    const reply = await this.responder.getReply(message.text.body, companyId, customer.id);
    if (!reply) return;

    try {
      const sent = await this.graphClient.sendTextMessage(customer.phone, reply);
      await this.messageRepo.create({
        companyId,
        customerId: customer.id,
        direction: WhatsAppDirection.OUT,
        body: reply,
        waMessageId: sent?.id ?? null,
        status: 'sent',
        autoReplied: true,
      });
    } catch (err) {
      this.logger.error(`Failed to send auto-reply to ${customer.phone}`, err as Error);
    }
  }

  private hasValidSignature(rawBody: Buffer, signature: string | undefined, appSecret: string): boolean {
    if (!signature) return false;
    const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  }
}
