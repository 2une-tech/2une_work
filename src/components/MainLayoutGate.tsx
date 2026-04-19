'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isMainGuestRoute } from '@/lib/mainGuestRoutes';

/**
 * Single place for (main) shell auth: refresh session once, and send guests to /login
 * only when they hit a protected worker route (not Explore or project details).
 */
export function MainLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, authReady, checkAuth } = useAuthStore();
  const didInit = useRef(false);

  const sessionBooting = !authReady || isLoading;

  useEffect(() => {
    if (!authReady) return;
    if (didInit.current) return;
    didInit.current = true;
    void checkAuth();
  }, [authReady, checkAuth]);

  useEffect(() => {
    if (!pathname) return;
    if (isMainGuestRoute(pathname)) return;
    if (sessionBooting) return;
    if (!user) router.replace('/login');
  }, [pathname, sessionBooting, user, router]);

  return <>{children}</>;
}
