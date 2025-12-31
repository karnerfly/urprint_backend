import { z } from 'zod';
import { EnvSchema, AppConfig } from './env.schma';
import dotenv from 'dotenv';

let cachedEnv: AppConfig | null = null;

export function loadConfig(paths: string | string[]): AppConfig {
  if (cachedEnv) return cachedEnv;

  dotenv.config({
    path: paths,
  });

  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables');
    const t = z.treeifyError(parsed.error);
    console.error(JSON.stringify(t));
    process.exit(1);
  }

  cachedEnv = {
    ...parsed.data,
    GetWildCardDomain: () => {
      return parsed.data.DOMAIN !== 'localhost'
        ? `.${parsed.data.DOMAIN}`
        : parsed.data.DOMAIN;
    },
  };

  return cachedEnv;
}
