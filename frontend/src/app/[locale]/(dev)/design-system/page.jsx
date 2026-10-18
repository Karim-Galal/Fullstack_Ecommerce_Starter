import { notFound } from 'next/navigation';
import { DesignSystemShowcase } from '@/components/dev/DesignSystemShowcase';

export const metadata = {
  title: 'Design System',
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DesignSystemShowcase />;
}
