import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { locales, isValidLocale, getLocaleDir } from '@/lib/locale';
import { getMessages } from '@/lib/messages';
import { Suspense } from 'react';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: {
    default: 'Commerce Starter',
    template: '%s | Commerce Starter',
  },
  description: 'A fast, secure storefront foundation.',
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!locale || !['en', 'ar'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  console.log('TRANSLATION DEBUG:', locale, Object.keys(messages), messages.common?.appName);
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Suspense fallback={<div className="shell py-20 text-center">Loading...</div>}>
            {children}
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}