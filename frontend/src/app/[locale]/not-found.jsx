import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Icon } from '@/components/icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { storeConfig } from '@/config/store';

const [brandLead, ...brandRestParts] = storeConfig.name.split(' ');
const brandRest = brandRestParts.join(' ');

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');

  return (
    <div className="flex min-h-[100svh] flex-col bg-surface">
      <header className="border-b border-border">
        <div className="shell flex min-h-16 items-center justify-between lg:min-h-20">
          <Link
            href={`/${locale}`}
            aria-label={storeConfig.name}
            className="group flex shrink-0 flex-col gap-1 leading-none"
          >
            <span className="text-[0.9rem] font-semibold uppercase tracking-[0.34em] text-text-primary">
              {brandLead}
            </span>

            {brandRest && (
              <span className="text-[0.55rem] font-medium uppercase tracking-[0.44em] text-text-tertiary transition-colors group-hover:text-accent">
                {brandRest}
              </span>
            )}
          </Link>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="shell flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
          404
        </p>

        <h1 className="mt-5 max-w-xl text-balance text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-5xl">
          {t('title')}
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-text-secondary sm:text-base">
          {t('message')}
        </p>

        <Link
          href={`/${locale}`}
          className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {t('goHome')}
          <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
        </Link>
      </main>

      <footer className="border-t border-border py-6">
        <div className="shell flex flex-col items-center justify-between gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-text-tertiary sm:flex-row">
          <span>{storeConfig.name}</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
