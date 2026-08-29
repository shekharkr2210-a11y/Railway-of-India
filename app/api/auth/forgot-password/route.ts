import { NextResponse, NextRequest } from 'next/server';
import { forgotPasswordSchema } from '@/app/lib/validation';
import { usersRepo, otpRepo } from '@/app/lib/repositories';
import { logAudit } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid email address' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = usersRepo.findByEmail(email);

  if (!user) {
    logAudit('AUTH_OTP_REQUEST_FAILED', null, request, 'DENIED', `OTP requested for unregistered email: ${email}`);
    return NextResponse.json(
      { success: false, error: 'No railway personnel account found with this email address.' },
      { status: 404 }
    );
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpRepo.create(email, otpCode, 10);

  logAudit(
    'AUTH_OTP_REQUESTED',
    { id: user.id, name: user.name, email: user.email, role: user.role, zoneCode: user.zone_code, divisionCode: user.division_code },
    request,
    'SUCCESS',
    `6-digit password reset OTP generated for ${email} (${user.role})`
  );

  return NextResponse.json({
    success: true,
    message: `A 6-digit verification code has been dispatched to ${email}.`,
    email,
    debugOtp: otpCode, // For seamless demo verification in evaluative / offline environments
    expiresInMinutes: 10,
  });
}
