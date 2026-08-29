import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/app/lib/db';
import { dbCounts } from '@/app/lib/repositories';
import { logAudit } from '@/app/lib/auth';
import { getSessionFromRequest } from '@/app/lib/session';

// In-memory or persisted configuration store
interface SystemConfig {
  optimizer: {
    clusteringStrategy: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE';
    minBufferMinutes: number;
    maxBlockDurationHours: number;
    crossZonalAutoCoordination: boolean;
    defaultHorizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
  crisIngestion: {
    tmsSyncIntervalMinutes: number;
    smmsSyncIntervalMinutes: number;
    tdmsSyncIntervalMinutes: number;
    autoIngestEnabled: boolean;
    crisBusEndpoint: string;
    dataRetentionDays: number;
  };
  security: {
    mtlsStrictEnforcement: boolean;
    sessionTimeoutMinutes: number;
    cryptoAlgorithm: 'HMAC-SHA256' | 'RSA-2048';
    mandatoryOtpForLargeSanctions: boolean;
  };
}

let activeConfig: SystemConfig = {
  optimizer: {
    clusteringStrategy: 'BALANCED',
    minBufferMinutes: 30,
    maxBlockDurationHours: 6,
    crossZonalAutoCoordination: true,
    defaultHorizon: 'WEEKLY',
  },
  crisIngestion: {
    tmsSyncIntervalMinutes: 5,
    smmsSyncIntervalMinutes: 15,
    tdmsSyncIntervalMinutes: 15,
    autoIngestEnabled: true,
    crisBusEndpoint: 'https://bus.cris.railnet.gov.in/api/v2/stream',
    dataRetentionDays: 90,
  },
  security: {
    mtlsStrictEnforcement: true,
    sessionTimeoutMinutes: 120,
    cryptoAlgorithm: 'HMAC-SHA256',
    mandatoryOtpForLargeSanctions: true,
  },
};

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const counts = dbCounts();
    const users = db.prepare('SELECT id, name, email, role, zone_code, division_code, is_active, created_at FROM users ORDER BY role').all();

    return NextResponse.json({
      success: true,
      config: activeConfig,
      systemInfo: {
        serverVersion: 'v2.4.0 (Enterprise AI Optimizer)',
        nodeEnv: process.env.NODE_ENV || 'development',
        dbPath: 'data/blockplanner.db',
        dbDriver: 'better-sqlite3 (WAL Mode)',
        tableStats: counts,
        usersCount: users.length,
        users,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve system settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (body && typeof body === 'object' && 'config' in body) {
      activeConfig = {
        ...activeConfig,
        ...(body as { config: Partial<SystemConfig> }).config,
      };

      logAudit(
        'SYSTEM_SETTINGS_UPDATED',
        session,
        request,
        'SUCCESS',
        `System configuration updated by ${session?.name || 'Administrator'} (${session?.role || 'BOARD_HQ'})`
      );

      return NextResponse.json({
        success: true,
        message: 'System settings saved successfully and applied to active AI scheduling engine.',
        config: activeConfig,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid configuration payload' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update system settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
