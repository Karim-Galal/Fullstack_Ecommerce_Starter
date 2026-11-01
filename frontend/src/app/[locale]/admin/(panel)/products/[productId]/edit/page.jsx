import { AdminProductForm } from '@/components/admin/AdminProductForm';

export const metadata = {
  title: 'Edit product',
};

export default async function AdminEditProductRoute({ params }) {
  const { productId } = await params;

  return <AdminProductForm productId={productId} />;
}
