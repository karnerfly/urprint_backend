import crypto from 'node:crypto';

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function getRandomBase64Url(n: number): string {
  const buffer = crypto.randomBytes(n);
  return buffer.toString('base64url');
}

export function getRandomHex(n: number): string {
  const buffer = crypto.randomBytes(n);
  return buffer.toString('hex');
}

export function getRandomCode(n: number): string {
  let otp = '';
  for (let i = 0; i < n; i++) {
    otp += numbers[crypto.randomInt(numbers.length)];
  }
  return otp;
}
