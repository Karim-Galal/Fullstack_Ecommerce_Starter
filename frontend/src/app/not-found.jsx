import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleDir } from '@/lib/locale';
import { storeConfig } from '@/config/store';

export async function generateMetadata() {
  const t = await getTranslations('notFound');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');
  const dir = getLocaleDir(locale);

  return (
    <html lang={locale} dir={dir}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-text-tertiary">
            {storeConfig.name}
          </p>

          <h1 className="mt-5 text-3xl font-normal tracking-tight text-text-primary sm:text-4xl">
            {t('title')}
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
            {t('message')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-on"
            >
              {t('goHome')}
            </Link>
          </div>

          <p className="mt-10 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-text-tertiary">
            <Link href="/en" className="hover:text-accent">
              English
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/ar" className="hover:text-accent">
              العربية
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
