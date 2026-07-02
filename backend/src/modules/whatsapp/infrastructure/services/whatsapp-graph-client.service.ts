import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppNotConfiguredError } from '../../domain/errors/whatsapp.errors';

interface GraphSendResponse {
  messages?: { id: string }[];
}

@Injectable()
export class WhatsAppGraphClient {
  private readonly logger = new Logger(WhatsAppGraphClient.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!(this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') && this.config.get<string>('WHATSAPP_ACCESS_TOKEN'));
  }

  /** Sends a free-text message via the Meta Graph API. Throws if the number/token isn't configured. */
  async sendTextMessage(to: string, body: string): Promise<{ id: string } | null> {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const apiVersion = this.config.get<string>('WHATSAPP_API_VERSION') ?? 'v21.0';

    if (!phoneNumberId || !accessToken) {
      throw new WhatsAppNotConfiguredError();
    }

    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      this.logger.error(`WhatsApp send failed (${res.status}): ${errBody}`);
      throw new Error(`WhatsApp send failed with status ${res.status}`);
    }

    const data = (await res.json()) as GraphSendResponse;
    return data.messages?.[0] ?? null;
  }
}
