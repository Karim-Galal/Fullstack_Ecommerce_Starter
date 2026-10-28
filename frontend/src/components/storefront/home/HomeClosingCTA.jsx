'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { storeConfig } from '@/config/store';

export function HomeClosingCTA() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="bg-surface">
      <div className="shell flex flex-col items-center py-20 text-center sm:py-24">
        <SectionHeading
          eyebrow={storeConfig.name}
          title={t('closing.title')}
          description={t('closing.text')}
          className="w-full max-w-2xl"
          titleClassName="text-balance text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-4xl"
          descriptionClassName="mx-auto mt-4 max-w-md text-sm leading-6 text-text-secondary"
        />

        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={`/${locale}/products?sort=created_at&direction=desc`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t('closing.primary')}
            <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
          </Link>

          <Link
            href={`/${locale}/register`}
            className="text-sm font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t('closing.secondary')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HomeClosingCTA;
