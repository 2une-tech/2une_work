/** Normalize App Router pathname for comparisons (trailing slash). */
export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Routes under the (main) layout that do not require a session.
 * Everything else under (main) sends guests to /login.
 */
export function isMainGuestRoute(pathname: string): boolean {
  if (!pathname) return false;
  const p = normalizePathname(pathname);
  if (p === '/') return true;
  if (p === '/worker-terms') return true;
  if (p.startsWith('/project/')) return true;
  return false;
}
