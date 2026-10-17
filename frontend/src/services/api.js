import axios from 'axios';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
const guestCartTokenKey = 'guest-cart-token';

const supportedLocales = ['en', 'ar'];
const defaultLocale = 'en';

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

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

  return window.localStorage.getItem(guestCartTokenKey);
}

function saveGuestCartToken(token) {
  if (typeof window !== 'undefined' && token) {
    window.localStorage.setItem(guestCartTokenKey, token);
  }
}

export async function csrf() {
  await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
    withXSRFToken: true,
  });
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
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data;
      const apiError = new Error(
        responseData?.message || 'Request failed',
      );

      apiError.status = error.response.status;
      apiError.errors = responseData?.errors || {};
      apiError.data = responseData;

      throw apiError;
    }

    throw error;
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