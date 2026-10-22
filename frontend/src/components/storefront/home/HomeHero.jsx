'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { storeConfig } from '@/config/store';

export function HomeHero() {
  const t = useTranslations('home');

  return (
    <section className="relative isolate overflow-hidden bg-[#111110] text-[#f6f3ee]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -end-32 -top-40 size-[34rem] rounded-full bg-white/[0.06] blur-3xl" />
        <div className="absolute -start-40 bottom-0 size-[28rem] rounded-full bg-[#a5824a]/10 blur-3xl" />
      </div>

      <div className="shell relative grid items-center gap-12 py-16 sm:py-20 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a86c]">
            {t('eyebrow')}
          </p>

          <h1 className="mt-6 text-balance text-[clamp(2.75rem,6.4vw,5rem)] font-normal leading-[1.02] tracking-[-0.035em] text-[#f7f4ef]">
            {t('heroTitle')}
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-[#cfcac1] sm:text-lg sm:leading-8">
            {t('heroDescription')}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#new-arrivals"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5f2ec] px-7 text-sm font-semibold text-[#171614] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c9a86c]"
            >
              {t('heroPrimary')}
              <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
            </a>

            <a
              href="#craft"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm font-semibold text-[#f5f2ec] transition-colors hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c9a86c]"
            >
              {t('heroSecondary')}
            </a>
          </div>

          <p className="mt-10 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.24em] text-[#8f8a81]">
            <span aria-hidden="true" className="h-px w-8 bg-[#8f8a81]" />
            {t('heroNote')}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[30rem] lg:max-w-none">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#171716] shadow-2xl">
            <img
              src="/images/hero-silver.svg"
              alt={t('heroImageAlt')}
              width="1000"
              height="1200"
              className="aspect-[4/5] h-full w-full object-cover"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
            />

            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.24em] text-white/70">
              <span>{storeConfig.name}</span>
              <span>01</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
