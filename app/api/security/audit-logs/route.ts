import { NextResponse } from 'next/server';
import { INITIAL_AUDIT_LOGS, INITIAL_SECURITY_STATUS } from '@/app/lib/security';
import { auditLogRepo } from '@/app/lib/repositories';

export async function GET() {
  try {
    const dbLogs = auditLogRepo.list(50);
    const count = auditLogRepo.count();

    return NextResponse.json({
      success: true,
      securityStatus: {
        ...INITIAL_SECURITY_STATUS,
        auditLogCount: count,
        latestAuditEventAt: dbLogs[0]?.timestamp || null,
      },
      auditLogs: dbLogs,
    });
  } catch {
    return NextResponse.json({
      success: true,
      securityStatus: INITIAL_SECURITY_STATUS,
      auditLogs: [],
    });
  }
}


