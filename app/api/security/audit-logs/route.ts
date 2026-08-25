import { NextResponse } from 'next/server';
import { INITIAL_AUDIT_LOGS, INITIAL_SECURITY_STATUS } from '@/app/lib/security';

export async function GET() {
  return NextResponse.json({
    success: true,
    securityStatus: INITIAL_SECURITY_STATUS,
    auditLogs: INITIAL_AUDIT_LOGS,
  });
}
