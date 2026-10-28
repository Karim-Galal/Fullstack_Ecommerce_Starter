'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const { setUser, setLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirmation) {
      setError(t('passwordMismatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordMinLength'));
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        device_name: 'web',
      });

      setUser(response.user);
      router.push('/');
    } catch (err) {
      setError(err.message || t('registrationFailed'));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-12">
      <RegisterForm
        formData={formData}
        isLoading={isLoading}
        error={error}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onGoogleLogin={() => authService.googleRedirect()}
        footer={
          <p className="mt-6 text-center text-sm text-text-secondary">
            {t('hasAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t('login')}
            </Link>
          </p>
        }
      />
    </main>
  );
}