import { apiUrl } from '@/services/api';
import { storeConfig } from '@/config/store';

const backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, '');

export function getTranslation(translations, locale) {
  if (!Array.isArray(translations)) return null;

  return (
    translations.find((translation) => translation?.locale === locale) ||
    translations.find((translation) => translation?.locale === 'en') ||
    translations[0] ||
    null
  );
}

export function getProductName(product, locale) {
  return (
    getTranslation(product?.translations, locale)?.name ||
    product?.name ||
    product?.slug ||
    ''
  );
}

export function getProductDescription(product, locale) {
  return getTranslation(product?.translations, locale)?.description || '';
}

export function resolveMediaUrl(path) {
  if (!path || typeof path !== 'string') return null;

  if (/^https?:\/\//i.test(path)) return path;

  if (path.startsWith('/storage/')) {
    return `${backendOrigin}${path}`;
  }

  return `${backendOrigin}/storage/${path.replace(/^\/+/, '')}`;
}

export function getProductImage(product, variant = 'card') {
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length === 0) return null;

  const primary =
    images.find((image) => image?.is_primary) || images[0];

  return resolveMediaUrl(
    primary?.variants?.[variant] ||
      primary?.url ||
      primary?.path ||
      null,
  );
}

export function getProductImages(product, variant = 'detail') {
  const images = Array.isArray(product?.images) ? product.images : [];

  return images
    .map((image) => ({
      id: image.id,
      alt: image.alt,
      url: resolveMediaUrl(
        image?.variants?.[variant] || image?.url || image?.path || null,
      ),
    }))
    .filter((image) => image.url);
}

export function formatProductPrice(value, locale, currency = storeConfig.currency) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function getCategoryName(category, locale) {
  return (
    getTranslation(category?.translations, locale)?.name ||
    category?.name ||
    category?.slug ||
    ''
  );
}

export function getCollectionName(collection, locale) {
  return (
    getTranslation(collection?.translations, locale)?.name ||
    collection?.name ||
    collection?.slug ||
    ''
  );
}

export function getCollectionDescription(collection, locale) {
  return getTranslation(collection?.translations, locale)?.description || '';
}
