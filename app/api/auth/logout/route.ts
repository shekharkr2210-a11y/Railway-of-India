import { NextResponse, NextRequest } from 'next/server';
import { clearSessionCookie, logAudit } from '@/app/lib/auth';
import { getSessionFromRequest } from '@/app/lib/session';

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  clearSessionCookie(response);
  if (session) {
    logAudit('AUTH_LOGOUT', session, request, 'SUCCESS', `User ${session.email ?? session.id} logged out`);
  }
  return response;
}