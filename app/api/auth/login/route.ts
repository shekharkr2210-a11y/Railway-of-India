import { NextResponse, NextRequest } from 'next/server';
import { loginSchema } from '@/app/lib/validation';
import { authenticateWithPassword, setSessionCookie, logAudit } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const user = authenticateWithPassword(parsed.data.email, parsed.data.password);
  if (!user) {
    logAudit('AUTH_LOGIN_FAILED', null, request, 'DENIED', `Failed login attempt for ${parsed.data.email}`);
    return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, user });
  setSessionCookie(response, user);
  logAudit('AUTH_LOGIN', user, request, 'SUCCESS', `User ${user.email} logged in (role ${user.role})`);
  return response;
}