import '../styles/index.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata = {
  title: {
    default: 'Commerce Starter',
    template: '%s | Commerce Starter',
  },
  description: 'A fast, secure storefront foundation.',
};

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>{children}</ThemeProvider>
  );
}