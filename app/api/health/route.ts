import { NextResponse } from 'next/server';
import { dbCounts } from '@/app/lib/repositories';
import pkg from '../../../package.json';

export async function GET() {
  let dbOk = true;
  let counts: { tasks: number; blocks: number; sanctions: number; auditLogs: number } | null = null;
  try {
    counts = dbCounts();
  } catch {
    dbOk = false;
  }
  return NextResponse.json(
    {
      ok: dbOk && counts !== null,
      version: pkg.version || '0.1.0',
      db: dbOk ? 'up' : 'down',
      uptimeSec: Math.round(process.uptime()),
      counts,
    },
    { status: dbOk ? 200 : 503 }
  );
}