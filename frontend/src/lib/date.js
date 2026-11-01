/**
 * Locale-aware date formatting without a date library.
 *
 * Admin APIs serialize timestamps as ISO 8601 strings, so callers can pass the
 * raw value through. Invalid or missing values render as an empty string.
 *
 * All modes use the browser's local timezone so dates match what the admin
 * sees in their own clock. The API sends UTC timestamps; `Date` converts them.
 */
const localeMap = {
  ar: 'ar-EG',
  en: 'en-GB',
};

function resolveLocale(locale) {
  return localeMap[locale] || localeMap.en;
}

function toDate(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Generic formatter kept for backwards compatibility with existing callers.
 */
export function formatDate(value, locale, options = {}) {
  const date = toDate(value);

  if (!date) return '';

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatShortDate(value, locale) {
  return formatDate(value, locale);
}

export function formatDateTime(value, locale) {
  const date = toDate(value);

  if (!date) return '';

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFullDate(value, locale) {
  const date = toDate(value);

  if (!date) return '';

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const relativeUnits = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function formatRelativeTime(value, locale) {
  const date = toDate(value);

  if (!date) return '';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(resolveLocale(locale), {
    numeric: 'auto',
  });

  for (const [unit, unitSeconds] of relativeUnits) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return formatter.format(seconds, 'second');
}

/**
 * Convert an ISO timestamp to the value expected by `<input type="datetime-local">`.
 */
export function toDateTimeLocalValue(value) {
  const date = toDate(value);

  if (!date) return '';

  const pad = (part) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
