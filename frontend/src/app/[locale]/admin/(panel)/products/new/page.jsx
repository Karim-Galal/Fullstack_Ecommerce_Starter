import { AdminProductForm } from '@/components/admin/AdminProductForm';

export const metadata = {
  title: 'New product',
};

export default function AdminNewProductRoute() {
  return <AdminProductForm />;
}
