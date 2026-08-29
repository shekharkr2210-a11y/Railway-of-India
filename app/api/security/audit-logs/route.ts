import { NextResponse } from 'next/server';
import { INITIAL_AUDIT_LOGS, INITIAL_SECURITY_STATUS } from '@/app/lib/security';
import { auditLogRepo } from '@/app/lib/repositories';

export async function GET() {
  try {
    const dbLogs = auditLogRepo.list(50);
    const count = auditLogRepo.count();
    const mergedLogs = dbLogs.length > 0 ? dbLogs : INITIAL_AUDIT_LOGS;

    return NextResponse.json({
      success: true,
      securityStatus: {
        ...INITIAL_SECURITY_STATUS,
        auditLogCount: count > 0 ? count : INITIAL_SECURITY_STATUS.auditLogCount,
        latestAuditEventAt: dbLogs[0]?.timestamp || new Date().toISOString(),
      },
      auditLogs: mergedLogs,
    });
  } catch {
    return NextResponse.json({
      success: true,
      securityStatus: INITIAL_SECURITY_STATUS,
      auditLogs: INITIAL_AUDIT_LOGS,
    });
  }
}

