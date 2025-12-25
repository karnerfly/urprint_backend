import { z } from 'zod';

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production', 'test']),

  PORT: z.coerce.number().default(3000),
  DOMAIN: z.string().default('localhost'),
  ALLOWED_ORIGIN: z.string(),

  DATABASE_URL: z.url(),

  CSRF_HEADER_NAME: z.string(),

  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_MAX_AGE_SECOND: z.coerce.number().int().positive(),
  REFRESH_TOKEN_MAX_AGE_SECOND: z.coerce.number().int().positive(),

  R2_REGION: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_UPLOAD_URL_EXPIRY_SECONDS: z.coerce.number().positive(),
  R2_READ_URL_EXPIRY_SECONDS: z.coerce.number().positive(),

  CRON_MIDNIGHT_TOKEN: z.string(),
  CRON_SECRET_KEY: z.string(),
});

export type Config = z.infer<typeof EnvSchema>;

export type ConfigFunctions = {
  GetWildCardDomain: () => string;
};

export type AppConfig = Config & ConfigFunctions;
