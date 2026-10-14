/**
 * Locale Configuration
 * Centralized locale settings for the application.
 */

export const locales = ['en', 'ar'];
export const defaultLocale = 'en';

export const localeNames = {
  en: 'English',
  ar: 'العربية',
};

export const localeDir = {
  en: 'ltr',
  ar: 'rtl',
};

/**
 * Check if a locale is supported.
 */
export function isValidLocale(locale) {
  return locales.includes(locale);
}

/**
 * Get the direction for a locale.
 */
export function getLocaleDir(locale) {
  return localeDir[locale] || 'ltr';
}

/**
 * Get the display name for a locale.
 */
export function getLocaleName(locale) {
  return localeNames[locale] || locale;
}