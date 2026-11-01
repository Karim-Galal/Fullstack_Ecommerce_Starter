import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { isValidLocale } from '@/lib/locale';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { ToastProvider } from '@/components/ui/feedback/ToastProvider';

export async function generateStaticParams() {
  return ['en', 'ar'].map((locale) => ({ locale }));
}

export const metadata = {
  title: {
    default: 'Admin | Commerce Starter',
    template: '%s | Admin | Commerce Starter',
  },
  description: 'Admin panel for Commerce Starter.',
};

export default async function AdminLocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <ToastProvider>
      <AdminGuard>
        <Suspense fallback={<div className="shell py-20 text-center">Loading...</div>}>
          <AdminLayout>{children}</AdminLayout>
        </Suspense>
      </AdminGuard>
    </ToastProvider>
  );
}
