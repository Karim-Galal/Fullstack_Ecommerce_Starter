'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function Footer() {
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tFooter = useTranslations('footer');

  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-sunken">
      <div className="shell py-10 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link
              href="/"
              className="text-xl font-bold text-text-primary transition-colors hover:text-primary"
            >
              {tCommon('appName')}
            </Link>

            <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
              {tCommon('heroDescription')}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-text-primary">
              {tFooter('about')}
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  {tFooter('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary">
                  {tFooter('contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-text-primary">
              {tFooter('contact')}
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              <li>
                <Link href="/faq" className="transition-colors hover:text-primary">
                  {tFooter('faq')}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-primary">
                  {tFooter('shipping')}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-primary">
                  {tFooter('returns')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary">
                  {tFooter('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-primary">
                  {tFooter('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-tertiary">
            © {year} {tCommon('appName')}. {tFooter('rightsReserved')}.
          </p>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-text-secondary">
              {locale === 'ar' ? 'العربية' : 'English'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}