'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/icons';
import { authService } from '@/services/auth';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations('auth');
  const tAdmin = useTranslations('admin');
  const { setUser, setLoading, setError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.login({ email, password, device_name: 'admin-web' });
      setUser(response.user);
      router.push(callbackUrl);
    } catch (err) {
      setErrorState(err.message || tAuth('invalidCredentials'));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/admin" className="inline-block mb-6">
            <span className="font-bold text-2xl text-text-primary">Admin Panel</span>
          </Link>
          <h1 className="text-3xl font-bold text-text-primary">{tAdmin.dashboard}</h1>
          <p className="mt-2 text-text-secondary">{tAuth.login}</p>
        </div>

        <div className="card p-6 space-y-6">
          {error && <Alert variant="destructive" description={error} dismissible onDismiss={() => setErrorState(null)} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={tAuth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tAuth.email}
              required
              autoComplete="email"
              autoFocus
              leftIcon="mail"
              error={error}
            />

            <Input
              label={tAuth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tAuth.password}
              required
              autoComplete="current-password"
              leftIcon="lock"
              error={error}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">{tAuth.rememberMe}</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {tAuth.forgotPassword}
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isLoading}>
              {tAuth.login}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-text-tertiary">{tAuth.or}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => authService.googleRedirect()}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23c4.1 0 7.57-2.07 9.56-5.1z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {tAuth.noAccount} <Link href="/register" className="text-primary hover:underline font-medium">{tAuth.register}</Link>
        </p>
      </div>
    </div>
  );
}