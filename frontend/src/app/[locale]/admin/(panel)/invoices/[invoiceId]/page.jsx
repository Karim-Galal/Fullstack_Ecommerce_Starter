import { AdminInvoiceDetail } from '@/components/admin/AdminInvoiceDetail';

export const metadata = {
  title: 'Invoice details',
};

export default async function AdminInvoiceDetailRoute({ params }) {
  const { invoiceId } = await params;

  return <AdminInvoiceDetail invoiceId={invoiceId} />;
}
