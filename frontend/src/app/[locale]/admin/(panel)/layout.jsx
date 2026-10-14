import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { isValidLocale } from '@/lib/locale';
import { getMessages } from '@/lib/messages';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Suspense } from 'react';

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

  if (!locale || !['en', 'ar'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Suspense fallback={<div className="shell py-20 text-center">Loading...</div>}>
            <AdminLayout>{children}</AdminLayout>
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}