import { locales, defaultLocale } from '@/lib/locale';

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const rules = {
    userAgent: '*',
    allow: '/',
    disallow: ['/admin', '/cart', '/checkout', '/account', '/login', '/register', '/forgot-password', '/reset-password'],
  };

  const sitemapUrls = locales.map((locale) => `${baseUrl}/${locale}/sitemap.xml`);

  return {
    rules,
    sitemap: sitemapUrls,
  };
}