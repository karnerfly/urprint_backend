import crypto from 'node:crypto';

export function getHash(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}
