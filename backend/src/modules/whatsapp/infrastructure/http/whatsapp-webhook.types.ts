export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp';
  metadata?: { display_phone_number: string; phone_number_id: string };
  contacts?: { profile: { name: string }; wa_id: string }[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatusUpdate[];
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}
