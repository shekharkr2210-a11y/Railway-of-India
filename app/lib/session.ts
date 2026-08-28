import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { SessionUser } from './types';

/**
 * Signed-cookie session layer (pure HMAC — safe to run at the proxy boundary).
 * Server-only module — never import from client components.
 */

export const SESSION_COOKIE = 'bp_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production. Set it via environment.');
    }
    console.warn('[session] SESSION_SECRET not set — using insecure dev fallback. NEVER use in production.');
    return 'DEV_INSECURE_SESSION_FALLBACK_KEY';
  }
  return secret;
}

interface SessionPayload {
  sub: string;
  name: string;
  role: SessionUser['role'];
  zone: string;
  division: string;
  exp: number;
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    zone: user.zoneCode || '',
    division: user.divisionCode || '',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): SessionUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.role) return null;
    return {
      id: payload.sub,
      name: payload.name || '',
      role: payload.role,
      zoneCode: payload.zone || '',
      divisionCode: payload.division || '',
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}