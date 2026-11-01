'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, isAdminUser } from '@/stores/authStore';
import { useIsMounted } from '@/lib/use-mounted';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

function AccessFallback({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4">
      {children}
    </div>
  );
}

function AccessLoading({ label }) {
  return (
    <AccessFallback>
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3"
      >
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-border border-t-primary"
        />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
    </AccessFallback>
  );
}

/**
 * Client-side UX guard for the admin panel route group.
 *
 * It waits for persisted auth state to hydrate, revalidates the Sanctum
 * session with `/auth/me`, and only renders admin children for active
 * `master_admin` or `staff` accounts. Backend policies remain authoritative.
 */
export function AdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin');

  const user = useAuthStore((state) => state.user);
  const sessionStatus = useAuthStore((state) => state.sessionStatus);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  const mounted = useIsMounted();
  const hasAdminAccess = isAdminUser(user);

  useEffect(() => {
    if (!mounted) return;

    if (sessionStatus === 'idle') {
      restoreSession();
    }
  }, [mounted, sessionStatus, restoreSession]);

  useEffect(() => {
    if (!mounted) return;

    if (sessionStatus === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(pathname || `/${locale}/admin`);

      router.replace(
        `/${locale}/admin/login?callbackUrl=${callbackUrl}`
      );

      return;
    }

    if (sessionStatus === 'authenticated' && !hasAdminAccess) {
      router.replace(`/${locale}`);
    }
  }, [mounted, sessionStatus, hasAdminAccess, pathname, locale, router]);

  if (!mounted || sessionStatus === 'idle' || sessionStatus === 'checking') {
    return <AccessLoading label={tCommon('loading')} />;
  }

  if (sessionStatus === 'error') {
    return (
      <AccessFallback>
        <Alert
          variant="destructive"
          title={tAdmin('sessionErrorTitle')}
          description={tAdmin('sessionErrorText')}
          className="max-w-md"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => restoreSession({ force: true })}
          >
            {tCommon('retry')}
          </Button>
        </Alert>
      </AccessFallback>
    );
  }

  // Customers and signed-out users are redirected by the effect above.
  if (!hasAdminAccess) {
    return <AccessLoading label={tCommon('loading')} />;
  }

  return children;
}

export default AdminGuard;
