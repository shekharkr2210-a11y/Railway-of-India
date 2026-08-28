import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SESSION_COOKIE, createSessionToken, getSessionFromRequest } from './session';
import { auditLogRepo, usersRepo } from './repositories';
import type { SessionUser, UserRole } from './types';

/**
 * Authentication + authorization helpers for route handlers.
 * Server-only module.
 */

export interface AuthResult {
  session: SessionUser;
}

export function authenticateWithPassword(email: string, password: string): SessionUser | null {
  const row = usersRepo.findByEmail(email);
  if (!row || !row.is_active) return null;
  if (!bcrypt.compareSync(password, row.password_hash)) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    zoneCode: row.zone_code || '',
    divisionCode: row.division_code || '',
  };
}

export function setSessionCookie(response: NextResponse, user: SessionUser): void {
  const token = createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Returns the authenticated session, or a 401/403 NextResponse to return from the route. */
export function requireRole(
  request: NextRequest,
  allowed: UserRole[]
): AuthResult | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized — a valid session is required' }, { status: 401 });
  }
  if (!allowed.includes(session.role)) {
    return NextResponse.json(
      { success: false, error: `Forbidden — role ${session.role} is not permitted to perform this action` },
      { status: 403 }
    );
  }
  return { session };
}

/** Scope check: returns true if the session may act on the given zone/division. */
export function isWithinScope(session: SessionUser, zoneCode?: string, divisionCode?: string): boolean {
  if (session.role === 'BOARD_HQ') return true;
  if (zoneCode && session.role === 'ZONAL_GM') return session.zoneCode === zoneCode;
  if (zoneCode && session.role === 'DIVISIONAL_DRM') return session.zoneCode === zoneCode;
  if (divisionCode && session.role === 'DIVISIONAL_DRM') return session.divisionCode === divisionCode;
  return true;
}

export function logAudit(
  action: string,
  session: SessionUser | null,
  request: NextRequest,
  status: 'SUCCESS' | 'WARNING' | 'DENIED',
  details: string,
  signatureHash?: string
): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  auditLogRepo.add({
    action,
    userRole: session ? session.role : 'ANONYMOUS',
    ipAddress: ip,
    status,
    details,
    signatureHash,
  });
}