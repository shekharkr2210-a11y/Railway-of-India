import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema } from '@/app/lib/validation';
import { usersRepo, otpRepo } from '@/app/lib/repositories';
import { logAudit } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid password reset data' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const otpVerification = otpRepo.verify(email, parsed.data.otp);

  if (!otpVerification.valid || !otpVerification.otpId) {
    logAudit('AUTH_PASSWORD_RESET_FAILED', null, request, 'DENIED', `Failed password reset attempt for ${email} (invalid OTP)`);
    return NextResponse.json({ success: false, error: otpVerification.error || 'Invalid or expired OTP code' }, { status: 400 });
  }

  const user = usersRepo.findByEmail(email);
  if (!user) {
    return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
  }

  // Hash new password
  const newHash = bcrypt.hashSync(parsed.data.newPassword, 10);
  const updated = usersRepo.updatePassword(email, newHash);

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Failed to update password in database' }, { status: 500 });
  }

  // Invalidate OTP
  otpRepo.markUsed(otpVerification.otpId);

  logAudit(
    'AUTH_PASSWORD_RESET_SUCCESS',
    { id: user.id, name: user.name, email: user.email, role: user.role, zoneCode: user.zone_code, divisionCode: user.division_code },
    request,
    'SUCCESS',
    `Password successfully updated via Email OTP verification for ${email} (${user.role})`
  );

  return NextResponse.json({
    success: true,
    message: 'Your password has been reset successfully. Please log in with your new credentials.',
  });
}
