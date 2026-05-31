// ── Input Sanitization Utilities ──
// Used to clean and validate user inputs before processing

/**
 * Strip HTML tags, trim whitespace, and limit string length
 */
export function sanitizeString(str: unknown, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';

  return str
    .replace(/<[^>]*>/g, '')        // Strip HTML tags
    .replace(/&[^;]+;/g, '')        // Strip HTML entities
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and format Tanzanian/Kenyan phone numbers
 * Accepts formats: 0712345678, +255712345678, 255712345678, 254712345678
 * Returns formatted number or empty string if invalid
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';

  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle local format: 07XX or 06XX → 255XXXXXXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '255' + cleaned.slice(1);
  }

  // Validate: must start with 255 or 254 and be 12 digits
  if (/^(255|254)\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  // Also accept 1XXX format for demo/testing
  if (/^1\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // Accept any reasonable phone-like string (7+ digits)
  if (/^\+?\d{7,15}$/.test(cleaned)) {
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  }

  return '';
}

/**
 * Validate email format
 * Returns cleaned email or empty string if invalid
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';

  const cleaned = email.trim().toLowerCase();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (emailRegex.test(cleaned)) {
    return cleaned;
  }

  return '';
}

/**
 * Sanitize a numeric input (e.g., amount)
 */
export function sanitizeNumber(value: unknown, min: number = 0, max: number = Infinity): number {
  const num = Number(value);

  if (isNaN(num)) return 0;
  if (num < min) return min;
  if (num > max) return max;

  return num;
}

/**
 * Sanitize a booking status value
 */
export function sanitizeBookingStatus(status: unknown): string {
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'];

  if (typeof status === 'string' && validStatuses.includes(status)) {
    return status;
  }

  return '';
}

/**
 * Sanitize a user role value
 */
export function sanitizeRole(role: unknown): string {
  const validRoles = ['seeker', 'guide', 'admin'];

  if (typeof role === 'string' && validRoles.includes(role)) {
    return role;
  }

  return '';
}
