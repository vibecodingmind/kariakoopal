import { createHmac, randomBytes } from 'crypto';

/**
 * Two-Factor Authentication utility for Chimbo Direct
 * Uses TOTP (Time-based One-Time Password) algorithm
 */

// Base32 character set for encoding secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Generate a new 2FA secret (base32 encoded, 20 bytes of randomness)
 */
export function generate2FASecret(): string {
  const buffer = randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate a TOTP code from a secret at a given time
 */
function generateTOTP(secret: string, timeStep: number): string {
  // Decode base32 secret
  const decoded = base32Decode(secret);
  // Create time buffer (8 bytes, big-endian)
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
  timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
  // HMAC-SHA1
  const hmac = createHmac('sha1', decoded).update(timeBuffer).digest();
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 |
    (hmac[offset + 1] & 0xff) << 16 |
    (hmac[offset + 2] & 0xff) << 8 |
    (hmac[offset + 3] & 0xff)) % 1000000;

  return code.toString().padStart(6, '0');
}

function base32Decode(str: string): Buffer {
  str = str.toUpperCase().replace(/=+$/, '');
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE32_CHARS.length; i++) {
    lookup[BASE32_CHARS[i]] = i;
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of str) {
    if (!(char in lookup)) continue;
    value = (value << 5) | lookup[char];
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Verify a TOTP code against a secret
 * @param secret Base32-encoded secret
 * @param code 6-digit code to verify
 * @param window Number of time steps to check before/after current (default 1 = ±30s)
 */
export function verify2FACode(secret: string, code: string, window: number = 1): boolean {
  const timeStep = Math.floor(Date.now() / 30000); // 30-second time steps

  for (let i = -window; i <= window; i++) {
    const expectedCode = generateTOTP(secret, timeStep + i);
    if (expectedCode === code) return true;
  }

  return false;
}

/**
 * Generate backup codes for 2FA recovery
 * @param count Number of codes to generate (default 8)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Generate an otpauth:// URI for QR code generation
 */
export function getOTPAuthURI(secret: string, email: string): string {
  const issuer = 'Chimbo Direct';
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
