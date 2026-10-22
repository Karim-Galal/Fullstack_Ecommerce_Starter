'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { storeConfig } from '@/config/store';
import { HomeHero } from '@/components/storefront/home/HomeHero';
import { NewArrivals } from '@/components/storefront/home/NewArrivals';
import { CraftStory } from '@/components/storefront/home/CraftStory';

export default function Home() {
  const t = useTranslations('home');
  const locale = useLocale();

  const principles = [
    {
      number: '01',
      title: t('principles.oneTitle'),
      text: t('principles.oneText'),
    },
    {
      number: '02',
      title: t('principles.twoTitle'),
      text: t('principles.twoText'),
    },
    {
      number: '03',
      title: t('principles.threeTitle'),
      text: t('principles.threeText'),
    },
  ];

  return (
    <>
      <HomeHero />

      <section className="border-b border-border bg-surface">
        <div className="shell grid gap-10 py-14 sm:grid-cols-3 sm:gap-8 sm:py-16">
          {principles.map((principle) => (
            <div
              key={principle.number}
              className="border-t border-border pt-6"
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
                {principle.number}
              </p>

              <h2 className="mt-3 text-lg font-medium tracking-tight text-text-primary">
                {principle.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {principle.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <NewArrivals />

      <CraftStory />

      <section className="bg-surface">
        <div className="shell flex flex-col items-center py-20 text-center sm:py-24">
          <p className="eyebrow">{storeConfig.name}</p>

          <h2 className="mt-4 max-w-2xl text-balance text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-4xl">
            {t('closing.title')}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-text-secondary">
            {t('closing.text')}
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#new-arrivals"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {t('closing.primary')}
              <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
            </a>

            <Link
              href={`/${locale}/register`}
              className="text-sm font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {t('closing.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
