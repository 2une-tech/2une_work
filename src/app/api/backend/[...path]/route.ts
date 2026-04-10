import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to the Express API. The browser always calls same-origin
 * `/api/backend/auth/...`, `/api/backend/users/...`, etc., so requests never hit
 * the Next page server by mistake (fixes 404 when Next and API share confusion on :3000).
 */
const UPSTREAM = (
  process.env.API_PROXY_TARGET ?? process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3000'
).replace(/\/$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function filterRequestHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'host' || HOP_BY_HOP.has(k)) return;
    out.set(key, value);
  });
  return out;
}

function filterResponseHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.length ? `/${pathSegments.join('/')}` : '';
  const target = `${UPSTREAM}${path}${req.nextUrl.search}`;

  const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstreamRes = await fetch(target, {
    method: req.method,
    headers: filterRequestHeaders(req.headers),
    body: body && body.byteLength > 0 ? body : undefined,
    cache: 'no-store',
  });

  const buf = await upstreamRes.arrayBuffer();
  return new NextResponse(buf, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: filterResponseHeaders(upstreamRes.headers),
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
