import { z } from 'zod';
import { EnvSchema, AppConfig } from './env.schma';

let cachedEnv: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedEnv) return cachedEnv;

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
