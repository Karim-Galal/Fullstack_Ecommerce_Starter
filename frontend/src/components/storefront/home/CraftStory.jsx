'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { storeConfig } from '@/config/store';

export function CraftStory() {
  const t = useTranslations('home');

  return (
    <section
      id="craft"
      className="scroll-mt-24 border-b border-border bg-surface-sunken"
    >
      <div className="shell grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div className="lg:order-2">
          <SectionHeading
            eyebrow={t('craft.eyebrow')}
            title={t('craft.title')}
            className="max-w-md"
          />

          <div className="mt-6 max-w-md space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
            <p>{t('craft.textOne')}</p>
            <p>{t('craft.textTwo')}</p>
          </div>

          <a
            href="#new-arrivals"
            className="mt-8 inline-flex items-center gap-2 border-b border-text-primary/30 pb-1 text-sm font-medium text-text-primary transition-colors hover:border-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t('craft.primary')}
            <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:order-1">
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-sm">
            <img
              src="/images/craft-silver.svg"
              alt={t('craft.imageAlt')}
              width="900"
              height="1100"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          <div className="absolute -bottom-4 end-5 rounded-full border border-border bg-surface-elevated px-5 py-3 text-[0.6rem] uppercase tracking-[0.24em] text-text-secondary shadow-sm">
            {storeConfig.name} / 02
          </div>
        </div>
      </div>
    </section>
  );
}

export default CraftStory;
