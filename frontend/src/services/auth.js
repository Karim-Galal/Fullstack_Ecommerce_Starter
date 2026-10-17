import { api, apiUrl, csrf } from './api';

export const authService = {
  async register(data) {
    await csrf();
    return api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data) {
    await csrf();
    return api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout() {
    await csrf();
    return api('/auth/logout', { method: 'POST' });
  },

  async me() {
    return api('/auth/me');
  },

  async forgotPassword(email) {
    await csrf();
    return api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data) {
    await csrf();
    return api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyEmail(id, hash) {
    return api(`/auth/email/verify/${id}/${hash}`);
  },

  async resendVerification() {
    await csrf();
    return api('/auth/email/verification-notification', { method: 'POST' });
  },

  async createToken(deviceName) {
    await csrf();
    return api('/auth/tokens', {
      method: 'POST',
      body: JSON.stringify({ device_name: deviceName }),
    });
  },

  async listTokens() {
    return api('/auth/tokens');
  },

  async revokeToken(tokenId) {
    await csrf();
    return api(`/auth/tokens/${tokenId}`, { method: 'DELETE' });
  },

  googleRedirect() {
    if (typeof window === 'undefined') return;

    const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

    // External Laravel OAuth endpoint; navigation must leave Next.js.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${backendUrl}/api/v1/google/redirect`;
  },

};