import crypto from 'node:crypto';
import { type Session } from 'src/models/dto/auth.dto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

export function encryptSessionPayload(payload: Session, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const plaintext = JSON.stringify(payload);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    encrypted.toString('base64'),
    tag.toString('base64'),
  ].join('.');
}

export function decryptSessionPayload(token: string, key: Buffer): Session {
  const [ivB64, encryptedB64, tagB64] = token.split('.');

  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
