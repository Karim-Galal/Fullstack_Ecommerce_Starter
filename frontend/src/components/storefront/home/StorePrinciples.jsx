'use client';

import { useTranslations } from 'next-intl';

export function StorePrinciples() {
  const t = useTranslations('home');

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
  );
}

export default StorePrinciples;
