import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_PRIVATE_KEY_BASE64: Joi.string().required(),
  JWT_PUBLIC_KEY_BASE64: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Throttle
  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  // WhatsApp (Meta Cloud API) — optional, see docs/whatsapp-meta-setup.md
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().optional(),
  WHATSAPP_APP_SECRET: Joi.string().optional(),
  WHATSAPP_API_VERSION: Joi.string().default('v21.0'),
  // UUID of the company this WhatsApp number belongs to — one phone number per deployment for now.
  WHATSAPP_COMPANY_ID: Joi.string().uuid().optional(),
});
