import crypto from 'node:crypto';

export function getRandomBase64Url(n: number): string {
  const buffer = crypto.randomBytes(n);
  return buffer.toString('base64url');
}

export function getRandomHex(n: number): string {
  const buffer = crypto.randomBytes(n);
  return buffer.toString('hex');
}
