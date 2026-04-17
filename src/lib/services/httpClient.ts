const ACCESS_KEY = '2une_access_token';
const REFRESH_KEY = '2une_refresh_token';

/** Same-origin prefix handled by `app/api/backend/[...path]/route.ts` (forwards to Express). */
const BROWSER_PROXY_PREFIX = '/api/backend';

/**
 * When set to a full URL on a *different* origin than the work app, the browser calls the API directly.
 * Otherwise the browser uses `/api/backend/...` so Next.js proxies to Express (see API_PROXY_TARGET).
 */
function explicitCrossOriginApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()?.replace(/\/$/, '') ?? '';
  if (!raw || (!raw.startsWith('http://') && !raw.startsWith('https://'))) return null;
  if (typeof window === 'undefined') return raw;
  try {
    if (new URL(raw).origin === window.location.origin) return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * Resolved API base for logging / tooling. In the browser this is either an explicit backend origin
 * or the work-app origin plus `/api/backend`.
 */
export function getApiBaseUrl(): string {
  const ex = explicitCrossOriginApiBase();
  if (typeof window !== 'undefined') {
    if (ex) return ex;
    return `${window.location.origin}${BROWSER_PROXY_PREFIX}`;
  }
  return (process.env.API_INTERNAL_URL ?? process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
}

function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const explicit = explicitCrossOriginApiBase();

  if (typeof window !== 'undefined') {
    if (explicit) return `${explicit}${p}`;
    return new URL(`${BROWSER_PROXY_PREFIX}${p}`, window.location.origin).toString();
  }

  const internal = (process.env.API_INTERNAL_URL ?? process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000').replace(
    /\/$/,
    '',
  );
  return `${internal}${p}`;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

type ApiSuccess<T> = { success: true; data: T };
type ApiFail = { success: false; error: { code: string; message: string; details?: unknown } };

function shouldDebugApi(): boolean {
  if (typeof window === 'undefined') return false;
  const env = process.env.NEXT_PUBLIC_DEBUG_API?.trim();
  if (env === '1' || env?.toLowerCase() === 'true') return true;
  try {
    return localStorage.getItem('2une_debug_api') === '1';
  } catch {
    return false;
  }
}

function debugLogApi(event: string, payload: Record<string, unknown>) {
  if (!shouldDebugApi()) return;
  // eslint-disable-next-line no-console
  console.info(`[2une][api] ${event}`, payload);
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function shouldInvalidateSessionOnRefreshFailure(status: number, body: ApiFail | null): boolean {
  if (status === 401 || status === 403) return true;
  const code = body?.error?.code ?? '';
  return (
    code === 'INVALID_REFRESH_TOKEN' ||
    code === 'REFRESH_EXPIRED' ||
    code === 'REFRESH_REUSE_DETECTED' ||
    code === 'USER_BLOCKED'
  );
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        const rawText = await res.text();
        let json: ApiSuccess<{ accessToken: string; refreshToken: string }> | ApiFail | null = null;
        try {
          json = JSON.parse(rawText) as ApiSuccess<{ accessToken: string; refreshToken: string }> | ApiFail;
        } catch {
          // Proxy/HTML/502 body — do not wipe the session; user can retry after refresh.
          return false;
        }
        if (!json || typeof json !== 'object' || !('success' in json)) {
          return false;
        }
        if (!json.success) {
          if (shouldInvalidateSessionOnRefreshFailure(res.status, json as ApiFail)) {
            clearTokens();
          }
          return false;
        }
        if (!res.ok) {
          return false;
        }
        setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      } catch {
        // Network error — keep refresh token for a later attempt.
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return await refreshInFlight;
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, body, headers: initHeaders, ...rest } = options;
  const url = buildUrl(path);
  const startedAt = Date.now();

  const headers = new Headers(initHeaders);
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getStoredAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = () =>
    fetch(url, {
      ...rest,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

  debugLogApi('request', {
    path,
    url,
    method: (rest.method ?? 'GET') as string,
    auth,
    hasBody: body !== undefined,
    body: body instanceof FormData ? '[FormData]' : body,
  });

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const okRefresh = await tryRefresh();
    if (okRefresh) {
      const token = getStoredAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      res = await doFetch();
    }
  }

  const rawText = await res.text();
  let json: ApiSuccess<T> | ApiFail;
  try {
    json = JSON.parse(rawText) as ApiSuccess<T> | ApiFail;
  } catch {
    const hint =
      res.status === 404
        ? ' (HTTP 404 — start the Express API and ensure API_PROXY_TARGET in the work app matches its URL, e.g. http://127.0.0.1:3000.)'
        : '';
    const preview = rawText.slice(0, 120).replace(/\s+/g, ' ');
    throw new ApiRequestError(
      res.status,
      'INVALID_RESPONSE',
      `Expected JSON from API; got ${res.headers.get('content-type') || 'unknown content-type'}.${hint}${preview ? ` Body starts with: ${preview}` : ''}`,
    );
  }

  debugLogApi('response', {
    path,
    status: res.status,
    ok: res.ok,
    ms: Date.now() - startedAt,
    json,
  });

  if (!json || typeof json !== 'object' || !('success' in json)) {
    throw new ApiRequestError(res.status, 'INVALID_RESPONSE', 'API response is not a { success, data } envelope');
  }

  if (!json.success) {
    throw new ApiRequestError(res.status, json.error.code, json.error.message, json.error.details);
  }

  return json.data;
}
