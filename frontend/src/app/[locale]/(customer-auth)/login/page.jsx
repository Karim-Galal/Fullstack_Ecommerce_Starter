'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { storeConfig } from '@/config/store';
import { useAuthStore } from '@/stores/authStore';
import LoginForm from '@/components/auth/LoginForm';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations('auth');

  const { setUser, setLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
        device_name: 'web',
      });

      setUser(response.user);
      router.push(callbackUrl);
    } catch (err) {
      setError(err.message || tAuth('invalidCredentials'));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.googleRedirect();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-block">
            <span className="text-2xl font-bold text-text-primary">
              {storeConfig.name}
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-text-primary">
            {tAuth('login')}
          </h1>

          <p className="mt-2 text-text-secondary">
            {tAuth('loginSubtitle')}
          </p>
        </div>

        <LoginForm
          email={email}
          password={password}
          rememberMe={rememberMe}
          isLoading={isLoading}
          error={error}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRememberMeChange={setRememberMe}
          onSubmit={handleSubmit}
          onGoogleLogin={handleGoogleLogin}
          onDismissError={() => setError(null)}
          footer={
            <p className="text-center text-sm text-text-secondary">
              {tAuth('noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                {tAuth('register')}
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}