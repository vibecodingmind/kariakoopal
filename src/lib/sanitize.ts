// Input sanitization utilities for security

// Strip HTML tags
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

// Sanitize string for database storage
export function sanitizeString(input: string): string {
  return stripHtml(input.trim()).slice(0, 10000); // Max 10K chars
}

// Validate phone number (Tanzanian format)
export function isValidTzPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  return /^(255|0)\d{9}$/.test(cleaned);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate amount (TZS)
export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= 100_000_000; // Max 100M TZS
}

// Validate rating
export function isValidRating(rating: number): boolean {
  return Number.isFinite(rating) && rating >= 1 && rating <= 5;
}

// Sanitize search query
export function sanitizeSearch(query: string): string {
  return query.replace(/[^\w\s\-@.]/g, '').trim().slice(0, 200);
}

// Validate MongoDB/ObjectId-like ID
export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9\-_]{1,50}$/.test(id);
}

// CSRF token generation
export function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
