'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { storeConfig } from '@/config/store';

const [brandLead, ...brandRestParts] = storeConfig.name.split(' ');
const brandRest = brandRestParts.join(' ');

export default function Footer() {
  const locale = useLocale();
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('navigation');

  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}#new-arrivals`, label: tFooter('newArrivals') },
    { href: `/${locale}/products`, label: tNav('products') },
    { href: `/${locale}/categories`, label: tNav('categories') },
    { href: `/${locale}/collections`, label: tNav('collections') },
  ];

  const accountLinks = [
    { href: `/${locale}/login`, label: tNav('login') },
    { href: `/${locale}/register`, label: tNav('register') },
    { href: `/${locale}/account`, label: tNav('account') },
    { href: `/${locale}/orders`, label: tNav('orders') },
  ];

  const contactEmail = storeConfig.contact.email;
  const contactPhone = storeConfig.contact.phone;

  return (
    <footer className="mt-auto border-t border-border bg-surface-sunken">
      <div className="shell py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div>
            <Link
              href={`/${locale}`}
              className="group inline-flex flex-col gap-1 leading-none"
              aria-label={storeConfig.name}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.34em] text-text-primary">
                {brandLead}
              </span>

              {brandRest && (
                <span className="text-[0.55rem] font-medium uppercase tracking-[0.44em] text-text-tertiary transition-colors group-hover:text-accent">
                  {brandRest}
                </span>
              )}
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-text-secondary">
              {storeConfig.description}
            </p>

            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.24em] text-text-tertiary">
              {tFooter('silverNote')}
            </p>

            {(contactEmail || contactPhone) && (
              <div className="mt-6 space-y-1 text-sm text-text-secondary">
                {contactEmail && (
                  <p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="transition-colors hover:text-text-primary"
                    >
                      {contactEmail}
                    </a>
                  </p>
                )}

                {contactPhone && (
                  <p>
                    <a
                      href={`tel:${contactPhone}`}
                      className="transition-colors hover:text-text-primary"
                    >
                      {contactPhone}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <nav aria-label={tFooter('explore')}>
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
              {tFooter('explore')}
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-text-secondary">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={tFooter('account')}>
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-text-tertiary">
              {tFooter('account')}
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-text-secondary">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-tertiary">
            © {year} {storeConfig.name}. {tFooter('rightsReserved')}.
          </p>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
