'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { storeConfig } from '@/config/store';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function LoginForm({
  email,
  password,
  rememberMe,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
  onGoogleLogin,
  showGoogleLogin = true,
  showRememberMe = true,
  showForgotPassword = true,
  footer,
}) {
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md">

      <div className="card space-y-6 p-6">
        {error && (
          <Alert
            variant="destructive"
            description={error}
          />
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label={t('email')}
            name="email"
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder={t('email')}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              label={t('password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={onPasswordChange}
              placeholder={t('password')}
              autoComplete="current-password"
              className="pr-10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-3 top-[38px] text-text-tertiary transition-colors hover:text-text-primary"
            >
              <Icon
                name={showPassword ? 'viewOff' : 'view'}
                size="sm"
              />
            </button>
          </div>

          {(showRememberMe || showForgotPassword) && (
            <div className="flex items-center justify-between gap-3 text-sm">
              {showRememberMe && (
                <label className="flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    checked={Boolean(rememberMe)}
                    onChange={onRememberMeChange}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  {t('rememberMe')}
                </label>
              )}

              {showForgotPassword && (
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
          >
            {t('login')}
          </Button>
        </form>

        {showGoogleLogin && onGoogleLogin && (
          <>
            <div className="relative flex items-center">
              <span className="w-full border-t border-border" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-surface px-4 text-sm text-text-tertiary">
                {t('or')}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={onGoogleLogin}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23c4.1 0 7.57-2.07 9.56-5.1z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.66-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.93 11.93 0 0 0 1 12c0 1.8.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          </>
        )}

        {footer}
      </div>
    </div>
  );
}