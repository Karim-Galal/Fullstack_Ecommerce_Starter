'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { locales, defaultLocale, getLocaleName } from '@/lib/locale';
import { Globe } from 'lucide-react';


export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  const handleLocaleChange = (newLocale) => {
    if (newLocale === locale) return;

    const segments = pathname.split('/').filter(Boolean);
    segments[0] = newLocale;
    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="relative inline-block">
      <button
        className="button gap-2 flex items-center "
        onClick={() => handleLocaleChange(locale === 'en' ? 'ar' : 'en')}
        aria-label={locale === 'en' ? t('switchToArabic') : t('switchToEnglish')}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          {getLocaleName(locale === 'en' ? 'ar' : 'en')}
        </span>
      </button>
    </div>
  );
}
