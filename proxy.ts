import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './app/lib/session';

/**
 * Next.js 16 Proxy (successor to the deprecated middleware.ts).
 * Enforces session protection and a simple per-IP token bucket on /api/*.
 * NOTE: only pure-crypto helpers (lib/session) may run here — never open the DB.
 */

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/reset-password',
  '/api/health',
]);

// Simple in-memory sliding token bucket (single-node safety net; move to Redis for scale-out).
const buckets = new Map<string, { tokens: number; last: number }>();
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip) || { tokens: RATE_LIMIT_MAX - 1, last: now };
  if (now - bucket.last > RATE_LIMIT_WINDOW_MS) {
    bucket.tokens = RATE_LIMIT_MAX - 1;
    bucket.last = now;
  }
  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return bucket.tokens < 0;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  // Static assets and public auth/health endpoints pass through.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') ||
    PUBLIC_API_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests — rate limit exceeded. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized — a valid session is required' }, { status: 401 });
    }
    const response = NextResponse.next();
    response.headers.set('x-session-user-id', session.id);
    response.headers.set('x-session-role', session.role);
    response.headers.set('x-session-zone', session.zoneCode || 'ALL');
    response.headers.set('x-session-division', session.divisionCode || 'ALL');
    return response;
  }

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // When visiting /login
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // When visiting protected page routes (e.g. /)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}