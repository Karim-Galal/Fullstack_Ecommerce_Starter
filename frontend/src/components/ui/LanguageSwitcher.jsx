'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { locales, getLocaleName } from '@/lib/locale';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLocaleChange = (newLocale) => {
    if (newLocale === locale || !locales.includes(newLocale)) {
      setIsOpen(false);
      return;
    }

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0 && locales.includes(segments[0])) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }

    const suffix =
      typeof window === 'undefined'
        ? ''
        : `${window.location.search}${window.location.hash}`;

    setIsOpen(false);
    router.push(`/${segments.join('/')}${suffix}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-text-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={
          locale === 'en' ? t('switchToArabic') : t('switchToEnglish')
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Icon name="globe" size="sm" />
        <span className="hidden text-xs font-medium sm:inline">
          {getLocaleName(locale)}
        </span>
        <Icon
          name="chevronDown"
          size="xs"
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        role="menu"
        aria-label={getLocaleName(locale)}
        aria-hidden={!isOpen}
        className={`absolute end-0 top-full z-50 mt-2 w-44 origin-top rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg transition-all duration-200 ease-out ${
          isOpen
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible -translate-y-1 scale-95 opacity-0'
        }`}
      >
        {locales.map((itemLocale) => {
          const selected = itemLocale === locale;

          return (
            <button
              key={itemLocale}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => handleLocaleChange(itemLocale)}
              aria-current={selected ? 'true' : undefined}
              className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                selected
                  ? 'bg-surface-hover text-text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <span>{getLocaleName(itemLocale)}</span>
              {selected && (
                <Icon name="check" size="sm" className="text-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
