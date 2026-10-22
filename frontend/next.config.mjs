import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const root = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.js');

const nextConfig = {
  turbopack: {
    root,
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default withNextIntl(nextConfig);