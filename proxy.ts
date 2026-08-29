import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './app/lib/session';

/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Handles rate limiting on API endpoints and enriches requests with session headers.
 * NOTE: only pure-crypto helpers (lib/session) may run here — never open the DB.
 */

// Simple in-memory sliding token bucket (single-node safety net).
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

  // Static assets pass through directly
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle legacy /login route: redirect to root page where LoginPage is embedded
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // API rate limiting & session enrichment
  if (pathname.startsWith('/api')) {
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests — rate limit exceeded. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const response = NextResponse.next();
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      const session = verifySessionToken(token);
      if (session) {
        response.headers.set('x-session-user-id', session.id);
        response.headers.set('x-session-role', session.role);
        response.headers.set('x-session-zone', session.zoneCode || 'ALL');
        response.headers.set('x-session-division', session.divisionCode || 'ALL');
      }
    }
    return response;
  }

  // All UI pages load normally (the root page / handles its own auth gate)
  return NextResponse.next();
}