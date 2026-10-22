import { Suspense } from 'react';
import { CatalogPage } from '@/components/storefront/catalog/CatalogPage';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-14">
          <ProductGridSkeleton count={8} />
        </div>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
