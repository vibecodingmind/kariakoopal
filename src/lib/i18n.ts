// Chimbo Direct Platform - Internationalization System
// Bilingual: Swahili (default) and English

export type Language = 'sw' | 'en';

import { sw } from './i18n/sw';
import { en } from './i18n/en';

const translations: Record<Language, Record<string, string>> = { sw, en };

/**
 * Translate a key to the given language.
 * Falls back to English, then to the raw key if not found.
 */
export function t(key: string, lang: Language): string {
  return translations[lang]?.[key] ?? translations.en?.[key] ?? key;
}

/**
 * Get all translation keys (from the English set as canonical).
 */
export function getTranslationKeys(): string[] {
  return Object.keys(translations.en);
}

/**
 * Get the full translation map for a language.
 */
export function getTranslations(lang: Language): Record<string, string> {
  return translations[lang] ?? translations.en;
}

export const supportedLanguages: { code: Language; label: string; labelEn: string }[] = [
  { code: 'sw', label: 'Kiswahili', labelEn: 'Swahili' },
  { code: 'en', label: 'English', labelEn: 'English' },
];
