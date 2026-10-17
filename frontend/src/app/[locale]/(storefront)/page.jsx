'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function Home() {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  const locale = useLocale();

  return (
    <main className="shell py-20 container">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <p className="eyebrow">{t('appName')}</p>
          <h1 className="mt-4 text-5xl font-bold">{t('appName')}</h1>
        </div>

        <LanguageSwitcher />
      </header>

      <section className="space-y-8">
        <p className="text-lg text-muted">{t('heroDescription')}</p>

        <div className="flex flex-wrap gap-4">
          <Link className="button inline-flex" href={`/${locale}/products`}>
            {tNav('shop')}
          </Link>

          <Link
            className="button inline-flex border border-border bg-muted text-primary hover:bg-muted/80"
            href={`/${locale}/admin/login`}
          >
            {tNav('admin')}
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-3">
        <article className="card p-6">
          <h2 className="mb-2 text-xl font-semibold">{t('productsTitle')}</h2>
          <p className="text-muted">{t('productsDescription')}</p>
        </article>

        <article className="card p-6">
          <h2 className="mb-2 text-xl font-semibold">{tNav('cart')}</h2>
          <p className="text-muted">{t('cartDescription')}</p>
        </article>

        <article className="card p-6">
          <h2 className="mb-2 text-xl font-semibold">{tNav('orders')}</h2>
          <p className="text-muted">{t('ordersDescription')}</p>
        </article>
      </section>
    </main>
  );
}