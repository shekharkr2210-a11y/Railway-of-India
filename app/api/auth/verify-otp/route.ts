import { NextResponse, NextRequest } from 'next/server';
import { verifyOtpSchema } from '@/app/lib/validation';
import { otpRepo } from '@/app/lib/repositories';
import { logAudit } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid OTP request' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const result = otpRepo.verify(email, parsed.data.otp);

  if (!result.valid) {
    logAudit('AUTH_OTP_VERIFY_FAILED', null, request, 'DENIED', `Invalid OTP verification attempt for ${email}`);
    return NextResponse.json({ success: false, error: result.error || 'Invalid or expired OTP' }, { status: 400 });
  }

  logAudit('AUTH_OTP_VERIFIED', null, request, 'SUCCESS', `OTP verified successfully for ${email}`);

  return NextResponse.json({
    success: true,
    message: 'OTP verified successfully. You may now enter your new password.',
    email,
    verified: true,
  });
}
