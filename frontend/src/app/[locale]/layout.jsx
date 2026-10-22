import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { locales, getLocaleDir } from '@/lib/locale';
import { getMessages } from '@/lib/messages';
import { storeConfig } from '@/config/store';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: {
    default: `${storeConfig.name} — ${storeConfig.tagline}`,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.description,
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!locale || !locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const dir = getLocaleDir(locale);

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}