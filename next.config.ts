import type { NextConfig } from 'next';

/**
 * Express origin for dev rewrites when the browser uses same-origin paths (see httpClient).
 * If the work app runs on port 3000, set this to your API (e.g. http://127.0.0.1:4000) and run Express there.
 * Default matches backend PORT=3000 while Next uses `next dev -p 3001`.
 */
const API_ORIGIN = (process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: `${API_ORIGIN}/auth/:path*` },
      { source: '/users/:path*', destination: `${API_ORIGIN}/users/:path*` },
      { source: '/projects/:path*', destination: `${API_ORIGIN}/projects/:path*` },
      { source: '/applications/:path*', destination: `${API_ORIGIN}/applications/:path*` },
      { source: '/tasks/:path*', destination: `${API_ORIGIN}/tasks/:path*` },
      { source: '/admin/:path*', destination: `${API_ORIGIN}/admin/:path*` },
    ];
  },
};

export default nextConfig;
