'use client';

import { useLocale, useMessages, useTranslations } from 'next-intl';
import Link from 'next/link';

export default function I18nTestPage() {
  const locale = useLocale();
  const messages = useMessages();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">I18n Diagnostic Test</h1>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-xl font-semibold">1. Static rendering</h2>
        <p>STATIC TEXT: If you can read this, React is rendering.</p>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-xl font-semibold">2. Active locale</h2>
        <p>useLocale(): {locale}</p>
        <p>HTML lang: {typeof document === 'undefined' ? 'Check browser' : document.documentElement.lang}</p>
        <div className="flex gap-4">
          <Link className="underline" href="/en">English (/en)</Link>
          <Link className="underline" href="/ar">العربية (/ar)</Link>
        </div>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-xl font-semibold">3. Raw messages</h2>
        <p>common.appName: {String(messages.common?.appName)}</p>
        <p>navigation.home: {String(messages.navigation?.home)}</p>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="text-xl font-semibold">4. useTranslations()</h2>
        <p>common.appName: {tCommon('appName')}</p>
        <p>navigation.home: {tNav('home')}</p>
      </section>
    </main>
  );
}