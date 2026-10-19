'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { getApiErrorMessage } from '@/lib/api-error';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isArabic = locale === 'ar';

  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const { setUser, setLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setErrorState] = useState(null);

  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setErrorState(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
        device_name: 'web',
        remember: rememberMe,
      });

      setUser(response.user);
      router.push(callbackUrl);
    } catch (err) {
      setErrorState(
        err?.status === 401
          ? tAuth('invalidCredentials')
          : getApiErrorMessage(err, tCommon)
      );
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;

    setErrorState(null);
    setIsGoogleLoading(true);

    try {
      await authService.googleRedirect();
    } catch (err) {
      setErrorState(getApiErrorMessage(err, tCommon));
      setIsGoogleLoading(false);
    }
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen flex items-center justify-center bg-surface-sunken px-4 py-12"
    >
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <Link
            href={`/${locale}`}
            className="mb-6 inline-block"
            aria-label="Home"
          >
            <span className="text-2xl font-bold text-text-primary">
              Commerce Starter
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-text-primary">
            {tAuth('login')}
          </h1>

          <p className="mt-2 text-text-secondary">
            {isArabic
              ? 'مرحبًا بعودتك، سجّل الدخول إلى حسابك'
              : 'Welcome back. Sign in to your account.'}
          </p>
        </header>

        <section className="card space-y-6 p-6">
          {error && (
            <Alert
              variant="destructive"
              description={error}
              dismissible
              onDismiss={() => setErrorState(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="login-email"
              label={tAuth('email')}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                isArabic
                  ? 'أدخل بريدك الإلكتروني'
                  : 'Enter your email address'
              }
              required
              autoComplete="email"
              autoFocus
              leftIcon="mail"
              disabled={isLoading}
            />

            <Input
              id="login-password"
              label={tAuth('password')}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isArabic
                  ? 'أدخل كلمة المرور'
                  : 'Enter your password'
              }
              required
              autoComplete="current-password"
              leftIcon="lock"
              disabled={isLoading}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />

                <span className="text-sm text-text-secondary">
                  {tAuth('rememberMe')}
                </span>
              </label>

              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {tAuth('forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={isGoogleLoading}
            >
              {isLoading
                ? isArabic
                  ? 'جارٍ تسجيل الدخول...'
                  : 'Signing in...'
                : tAuth('login')}
            </Button>
          </form>

          <div className="relative flex items-center">
            <div className="w-full border-t border-border" />

            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface px-4 text-sm text-text-tertiary">
              {tAuth('or')}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            leftIcon={isGoogleLoading ? undefined : 'google'}
            loading={isGoogleLoading}
            disabled={isLoading}
            onClick={handleGoogleLogin}
          >
            {isGoogleLoading
              ? isArabic
                ? 'جارٍ التحويل إلى Google...'
                : 'Redirecting to Google...'
              : isArabic
                ? 'المتابعة باستخدام Google'
                : 'Continue with Google'}
          </Button>

          <p className="text-center text-sm text-text-secondary">
            {tAuth('noAccount')}{' '}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-primary hover:underline"
            >
              {tAuth('register')}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}