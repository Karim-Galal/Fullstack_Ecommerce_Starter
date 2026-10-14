import { locales, defaultLocale } from '@/lib/locale';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const currentDate = new Date();

  const staticRoutes = ['', 'products', 'categories', 'collections'];

  const urls = [];

  for (const locale of locales) {
    // Add homepage and static pages for each locale
    for (const route of staticRoutes) {
      const path = route ? `/${locale}/${route}` : `/${locale}`;
      urls.push({
        url: `${baseUrl}${path}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${route ? `/${route}` : ''}`])
          ),
        },
      });
    }
  }

  return urls;
}