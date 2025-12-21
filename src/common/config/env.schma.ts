import { z } from 'zod';

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production', 'test']),

  PORT: z.coerce.number().default(3000),
  DOMAIN: z.string().default('localhost'),
  ALLOWED_ORIGIN: z.string(),

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_MAX_AGE_SECOND: z.coerce.number().int().positive(),
  REFRESH_TOKEN_MAX_AGE_SECOND: z.coerce.number().int().positive(),

  R2_BUCKET_NAME: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_UPLOAD_URL_EXPIRY_SECONDS: z.coerce.number().positive(),
  R2_READ_URL_EXPIRY_SECONDS: z.coerce.number().positive(),
});

export type Config = z.infer<typeof EnvSchema>;
