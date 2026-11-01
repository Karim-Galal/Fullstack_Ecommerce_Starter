import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail';

export const metadata = {
  title: 'Order details',
};

export default async function AdminOrderDetailRoute({ params }) {
  const { orderId } = await params;

  return <AdminOrderDetail orderId={orderId} />;
}
