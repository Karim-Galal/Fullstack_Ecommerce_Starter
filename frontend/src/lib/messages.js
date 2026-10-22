const loaders = {
  en: {
    common: () => import('@/translations/en/common.json'),
    navigation: () => import('@/translations/en/navigation.json'),
    auth: () => import('@/translations/en/auth.json'),
    product: () => import('@/translations/en/product.json'),
    cart: () => import('@/translations/en/cart.json'),
    checkout: () => import('@/translations/en/checkout.json'),
    admin: () => import('@/translations/en/admin.json'),
    footer: () => import('@/translations/en/footer.json'),
    home: () => import('@/translations/en/home.json'),
    catalog: () => import('@/translations/en/catalog.json'),
    wishlist: () => import('@/translations/en/wishlist.json'),
    account: () => import('@/translations/en/account.json'),
    language: () => import('@/translations/en/language.json'),
    notFound: () => import('@/translations/en/notFound.json'),
    validation: () => import('@/translations/en/validation.json'),
  },
  ar: {
    common: () => import('@/translations/ar/common.json'),
    navigation: () => import('@/translations/ar/navigation.json'),
    auth: () => import('@/translations/ar/auth.json'),
    product: () => import('@/translations/ar/product.json'),
    cart: () => import('@/translations/ar/cart.json'),
    checkout: () => import('@/translations/ar/checkout.json'),
    admin: () => import('@/translations/ar/admin.json'),
    footer: () => import('@/translations/ar/footer.json'),
    home: () => import('@/translations/ar/home.json'),
    catalog: () => import('@/translations/ar/catalog.json'),
    wishlist: () => import('@/translations/ar/wishlist.json'),
    account: () => import('@/translations/ar/account.json'),
    language: () => import('@/translations/ar/language.json'),
    notFound: () => import('@/translations/ar/notFound.json'),
    validation: () => import('@/translations/ar/validation.json'),
  },
};

export async function getMessages(locale) {
  if (!locale || !['en', 'ar'].includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const entries = await Promise.all(
    Object.entries(loaders[locale]).map(async ([namespace, load]) => {
      const translationFile = await load();
      return [namespace, translationFile.default];
    }),
  );

  return Object.fromEntries(entries);
}
