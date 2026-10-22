import '../styles/index.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { storeConfig } from '@/config/store';

export const metadata = {
  title: {
    default: `${storeConfig.name} — ${storeConfig.tagline}`,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.description,
};

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>{children}</ThemeProvider>
  );
}