import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from './store';
import { isMainGuestRoute } from './mainGuestRoutes';

/**
 * Auth state for pages under the (main) layout. Guest redirects are handled by MainLayoutGate.
 */
export function useRequireAuth() {
  const pathname = usePathname();
  const { user, isLoading, authReady } = useAuthStore();

  const sessionBooting = !authReady || isLoading;

  const isGuestRoute = pathname ? isMainGuestRoute(pathname) : false;

  const isAllowed = useMemo(
    () => isGuestRoute || (!!user && !sessionBooting),
    [isGuestRoute, user, sessionBooting],
  );

  return {
    user,
    isLoading: sessionBooting,
    isAllowed,
    isPublic: isGuestRoute,
  };
}
