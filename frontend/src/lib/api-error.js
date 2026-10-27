import { normalizeApiError } from '@/services/api';

const supportedErrorKinds = new Set([
  'offline',
  'network',
  'timeout',
  'unauthenticated',
  'session_expired',
  'forbidden',
  'not_found',
  'validation',
  'conflict',
  'rate_limit',
  'server',
  'bad_request',
  'http',
  'cancelled',
  'unknown',
]);

export function getApiErrorMessage(error, t, fallbackMessage) {
  const normalizedError = normalizeApiError(error);
  const kind = supportedErrorKinds.has(normalizedError.kind)
    ? normalizedError.kind
    : 'unknown';

  if (kind === 'unknown' && fallbackMessage) {
    return fallbackMessage;
  }

  return t(`apiErrors.${kind}`);
}