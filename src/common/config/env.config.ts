import { z } from 'zod';
import { EnvSchema, Config } from './env.schma';

let cachedEnv: Config | null = null;

export function loadConfig(): Config {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables');
    let t = z.treeifyError(parsed.error);
    console.error(JSON.stringify(t));
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
