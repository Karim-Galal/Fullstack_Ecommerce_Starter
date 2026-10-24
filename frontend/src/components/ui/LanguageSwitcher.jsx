
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { DropdownMenu } from '@/components/ui/overlays/DropdownMenu';
import { locales, getLocaleName } from '@/lib/locale';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  const handleLocaleChange = (newLocale) => {
    if (newLocale === locale || !locales.includes(newLocale)) {
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

    router.push(`/${segments.join('/')}${suffix}`);
  };

  const menuItems = locales.map((itemLocale) => ({
    key: itemLocale,
    label: getLocaleName(itemLocale),
    selected: itemLocale === locale,
    onClick: () => handleLocaleChange(itemLocale),
  }));

  return (
    <DropdownMenu
      label={getLocaleName(locale)}
      align="end"
      menuClassName="w-44 rounded-xl p-1.5"
      items={menuItems}
      trigger={({ isOpen }) => (
        <span className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-text-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-text-primary">
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
          <span className="sr-only">
            {locale === 'en'
              ? t('switchToArabic')
              : t('switchToEnglish')}
          </span>
        </span>
      )}
    />
  );
}

export default LanguageSwitcher;
