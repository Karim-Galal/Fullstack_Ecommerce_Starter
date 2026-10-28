import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { ToastProvider } from '@/components/ui/feedback/ToastProvider';

export function StorefrontHeader() {
  return <Navbar />;
}

export function StorefrontFooter() {
  return <Footer />;
}

export function StorefrontLayout({ children }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-surface text-text-primary">
        <StorefrontHeader />

        <main className="w-full flex-1">
          {children}
        </main>

        <StorefrontFooter />
      </div>
    </ToastProvider>
  );
}

export default StorefrontLayout;