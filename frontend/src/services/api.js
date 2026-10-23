import axios from 'axios';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
const guestCartTokenKey = 'guest-cart-token';
const requestTimeout = 15000;

const supportedLocales = ['en', 'ar'];
const defaultLocale = 'en';

export const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: requestTimeout,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = 'ApiError';
    this.kind = options.kind || 'unknown';
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.errors = options.errors || {};
    this.data = options.data ?? null;
    this.retryable = options.retryable ?? false;
    this.isApiError = true;
  }
}


function getHttpErrorKind(status) {
  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 408:
      return 'timeout';
    case 409:
      return 'conflict';
    case 419:
      return 'session_expired';
    case 422:
      return 'validation';
    case 429:
      return 'rate_limit';
    default:
      return status >= 500 ? 'server' : 'http';
  }
}

export function normalizeApiError(error) {
  if (error?.isApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError(
      'An unexpected error occurred.',
      { kind: 'unknown' },
    );
  }

  if (error.code === 'ERR_CANCELED') {
    return new ApiError('Request was cancelled.', {
      kind: 'cancelled',
      code: error.code,
    });
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('The request timed out.', {
      kind: 'timeout',
      code: error.code,
      retryable: true,
    });
  }

  if (!error.response) {
    const isOffline =
      typeof navigator !== 'undefined' && navigator.onLine === false;

    return new ApiError(
      isOffline
        ? 'You are offline.'
        : 'Unable to connect to the server.',
      {
        kind: isOffline ? 'offline' : 'network',
        code: error.code,
        retryable: true,
      },
    );
  }

  const { status, data } = error.response;
  const kind = getHttpErrorKind(status);

  const retryable =
    status === 408 || status === 429 || status >= 500;

  return new ApiError(
    data?.message || 'The request could not be completed.',
    {
      kind,
      status,
      code: error.code,
      errors:
        data?.errors &&
        typeof data.errors === 'object' &&
        !Array.isArray(data.errors)
          ? data.errors
          : {},
      data,
      retryable,
    },
  );
}

export function getCurrentLocale() {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const locale = window.location.pathname.split('/').filter(Boolean)[0];

  return supportedLocales.includes(locale) ? locale : defaultLocale;
}

function normalizeLocale(locale) {
  return supportedLocales.includes(locale) ? locale : defaultLocale;
}

function getGuestCartToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(guestCartTokenKey);
  } catch {
    return null;
  }
}

function saveGuestCartToken(token) {
  if (typeof window === 'undefined' || !token) {
    return;
  }

  try {
    window.localStorage.setItem(guestCartTokenKey, token);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export async function csrf() {
  try {
    await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
      timeout: requestTimeout,
      withCredentials: true,
      withXSRFToken: true,
      headers: {
        Accept: 'application/json',
        'Accept-Language': getCurrentLocale(),
      },
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function api(path, options = {}) {
  const { headers, locale, body, ...requestOptions } = options;
  const language = normalizeLocale(locale || getCurrentLocale());
  const data = body !== undefined ? body : requestOptions.data;

  const requestHeaders = {
    'Accept-Language': language,
    ...headers,
  };

  const guestCartToken = getGuestCartToken();

  if (guestCartToken && !requestHeaders['X-Guest-Cart']) {
    requestHeaders['X-Guest-Cart'] = guestCartToken;
  }

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    requestHeaders['Content-Type'] = undefined;
  }

  try {
    const response = await apiClient.request({
      ...requestOptions,
      url: path,
      data,
      headers: requestHeaders,
    });

    saveGuestCartToken(response.headers['x-guest-cart']);

    return response.status === 204 ? null : response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function getAuthHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': getCurrentLocale(),
  };
}

export { apiUrl };