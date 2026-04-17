import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from './store';

const PUBLIC_PATHS = new Set<string>(['/', '/login', '/signup', '/verify-email']);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function useRequireAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, authReady, checkAuth } = useAuthStore();
  const didInit = useRef(false);

  const sessionBooting = !authReady || isLoading;

  // After persisted session is loaded, validate tokens once.
  useEffect(() => {
    if (!authReady) return;
    if (didInit.current) return;
    didInit.current = true;
    void checkAuth();
  }, [authReady, checkAuth]);

  const isPublic = PUBLIC_PATHS.has(normalizePathname(pathname));

  useEffect(() => {
    if (isPublic) return;
    if (sessionBooting) return;
    if (!user) router.replace('/login');
  }, [isPublic, sessionBooting, user, router]);

  return {
    user,
    isLoading: sessionBooting,
    isAllowed: isPublic || (!!user && !sessionBooting),
    isPublic,
  };
}
