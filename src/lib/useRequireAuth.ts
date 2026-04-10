import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from './store';

const PUBLIC_PATHS = new Set<string>(['/', '/login', '/signup', '/verify-email']);

export function useRequireAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const didInit = useRef(false);

  // Bootstrap auth once on first protected render.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void checkAuth();
  }, [checkAuth]);

  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (isLoading) return;
    if (!user) router.replace('/login');
  }, [isPublic, isLoading, user, router]);

  return {
    user,
    isLoading,
    isAllowed: isPublic || (!!user && !isLoading),
    isPublic,
  };
}

