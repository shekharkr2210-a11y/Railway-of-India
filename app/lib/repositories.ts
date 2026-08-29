import type { Database } from 'better-sqlite3';
import { ensureBootstrapped } from './bootstrap';
import type { BlockWindow, TrainMovement } from './types';
import type { AuditLogEntry } from './security';

/**
 * SQL repositories for the non-task entities (blocks, sanctions, audit logs,
 * users, sources, reference data). Server-only module.
 */

const db: Database = ensureBootstrapped();

// ---------- Users ----------

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'BOARD_HQ' | 'ZONAL_GM' | 'DIVISIONAL_DRM' | 'SECTION_CONTROLLER';
  zone_code: string;
  division_code: string;
  is_active: number;
  created_at: string;
}

export const usersRepo = {
  findByEmail(email: string): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  },
  findById(id: string): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  },
};

// ---------- Audit logs ----------

function parseAuditRow(r: {
  id: string; timestamp: string; action: string; user_role: string; ip_address: string; status: string; details: string; signature_hash: string;
}): AuditLogEntry {
  return {
    id: r.id,
    timestamp: r.timestamp,
    action: r.action,
    userRole: r.user_role || 'SYSTEM',
    ipAddress: r.ip_address || '-',
    status: r.status as AuditLogEntry['status'],
    digitalSignature: r.signature_hash || '-',
    details: r.details,
  };
}

export const auditLogRepo = {
  add(entry: {
    action: string;
    userRole?: string;
    ipAddress?: string;
    status: 'SUCCESS' | 'WARNING' | 'DENIED';
    details: string;
    signatureHash?: string;
  }): void {
    const id = `LOG-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`;
    db.prepare(
      `INSERT INTO audit_logs (id, timestamp, action, user_id, user_role, ip_address, status, details, signature_hash)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`
    ).run(
      id,
      new Date().toISOString(),
      entry.action,
      entry.userRole || 'SYSTEM',
      entry.ipAddress || '-',
      entry.status,
      entry.details,
      entry.signatureHash || '-'
    );
  },
  list(limit = 200): AuditLogEntry[] {
    const rows = db
      .prepare(
        'SELECT id, timestamp, action, user_role, ip_address, status, details, signature_hash FROM audit_logs ORDER BY timestamp DESC LIMIT ?'
      )
      .all(limit) as unknown as Parameters<typeof parseAuditRow>[0][];
    return rows.map(parseAuditRow);
  },
  count(): number {
    const row = db.prepare('SELECT COUNT(*) AS c FROM audit_logs').get() as { c: number };
    return Number(row.c);
  },
};
// ---------- Block windows ----------

interface BlockRow {
  id: string;
  zone_code: string;
  division_code: string;
  section_id: string;
  section_name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  is_shadow_block: number;
  participating_departments: string | null;
  task_ids: string | null;
  power_block_required: number;
  bdms_status: string;
  downtime_saved_hours: number;
  train_impact_minutes: number;
  horizon: string;
  cross_zonal_impact: number;
  assigned_machines: string | null;
  scheduled_date: string | null;
  created_at: string;
}

function rowToBlock(r: BlockRow): BlockWindow {
  return {
    id: r.id,
    zoneCode: r.zone_code,
    divisionCode: r.division_code,
    sectionId: r.section_id,
    sectionName: r.section_name,
    startTime: r.start_time,
    endTime: r.end_time,
    durationHours: r.duration_hours,
    isShadowBlock: !!r.is_shadow_block,
    participatingDepartments: JSON.parse(r.participating_departments || '[]') as BlockWindow['participatingDepartments'],
    taskIds: JSON.parse(r.task_ids || '[]') as string[],
    powerBlockRequired: !!r.power_block_required,
    bdmsStatus: r.bdms_status as BlockWindow['bdmsStatus'],
    downtimeSavedHours: r.downtime_saved_hours,
    trainImpactMinutes: r.train_impact_minutes,
    horizon: r.horizon as BlockWindow['horizon'],
    crossZonalImpact: !!r.cross_zonal_impact,
    assignedMachines: r.assigned_machines ? (JSON.parse(r.assigned_machines) as string[]) : undefined,
    scheduledDate: r.scheduled_date || undefined,
  };
}

function blockToParams(b: BlockWindow): Record<string, unknown> {
  return {
    id: b.id,
    zoneCode: b.zoneCode,
    divisionCode: b.divisionCode,
    sectionId: b.sectionId,
    sectionName: b.sectionName,
    startTime: b.startTime,
    endTime: b.endTime,
    durationHours: b.durationHours,
    isShadowBlock: b.isShadowBlock ? 1 : 0,
    participatingDepartments: JSON.stringify(b.participatingDepartments || []),
    taskIds: JSON.stringify(b.taskIds || []),
    powerBlockRequired: b.powerBlockRequired ? 1 : 0,
    bdmsStatus: b.bdmsStatus,
    downtimeSavedHours: b.downtimeSavedHours,
    trainImpactMinutes: b.trainImpactMinutes,
    horizon: b.horizon,
    crossZonalImpact: b.crossZonalImpact ? 1 : 0,
    assignedMachines: b.assignedMachines ? JSON.stringify(b.assignedMachines) : null,
    scheduledDate: b.scheduledDate || null,
  };
}

export const blockWindowsRepo = {
  upsertMany(blocks: BlockWindow[], createdBy?: string): void {
    const stmt = db.prepare(
      `INSERT INTO block_windows (id, zone_code, division_code, section_id, section_name, start_time, end_time, duration_hours,
         is_shadow_block, participating_departments, task_ids, power_block_required, bdms_status, downtime_saved_hours,
         train_impact_minutes, horizon, cross_zonal_impact, assigned_machines, scheduled_date, created_by, created_at)
       VALUES (@id, @zoneCode, @divisionCode, @sectionId, @sectionName, @startTime, @endTime, @durationHours,
         @isShadowBlock, @participatingDepartments, @taskIds, @powerBlockRequired, @bdmsStatus, @downtimeSavedHours,
         @trainImpactMinutes, @horizon, @crossZonalImpact, @assignedMachines, @scheduledDate, @createdBy, @createdAt)
       ON CONFLICT(id) DO UPDATE SET
         bdms_status = excluded.bdms_status, scheduled_date = excluded.scheduled_date`
    );
    db.transaction((items: BlockWindow[]) => {
      for (const b of items) {
        stmt.run({ ...blockToParams(b), createdBy: createdBy || 'OPTIMIZER', createdAt: new Date().toISOString() });
      }
    })(blocks);
  },
  findByBlockId(id: string): BlockWindow | undefined {
    const row = db.prepare('SELECT * FROM block_windows WHERE id = ?').get(id) as unknown as BlockRow | undefined;
    return row ? rowToBlock(row) : undefined;
  },
  updateStatus(id: string, status: BlockWindow['bdmsStatus']): void {
    db.prepare('UPDATE block_windows SET bdms_status = ? WHERE id = ?').run(status, id);
  },
  list(): BlockWindow[] {
    const rows = db.prepare('SELECT * FROM block_windows ORDER BY scheduled_date, start_time').all() as unknown as BlockRow[];
    return rows.map(rowToBlock);
  },
};
// ---------- Sanctions ----------

export interface SanctionRow {
  id: string;
  block_id: string;
  signed_by: string;
  signed_role: string;
  signature: string;
  payload_hash: string;
  payload: string | null;
  created_at: string;
}

export const sanctionsRepo = {
  create(s: { blockId: string; signedBy: string; signedRole: string; signature: string; payloadHash: string; payload: Record<string, unknown> }): void {
    db.prepare(
      `INSERT INTO sanctions (id, block_id, signed_by, signed_role, signature, payload_hash, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `SAN-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`,
      s.blockId,
      s.signedBy,
      s.signedRole,
      s.signature,
      s.payloadHash,
      JSON.stringify(s.payload),
      new Date().toISOString()
    );
  },
  findByBlockId(blockId: string): SanctionRow | undefined {
    return db.prepare('SELECT * FROM sanctions WHERE block_id = ? ORDER BY created_at DESC LIMIT 1').get(blockId) as SanctionRow | undefined;
  },
};

// ---------- Data sources ----------

export const sourceRepo = {
  counts(): { sourceSystem: string; count: number; lastSyncAt: string | null }[] {
    const rows = db
      .prepare('SELECT source_system, COUNT(*) AS c, MAX(created_at) AS last FROM tasks GROUP BY source_system ORDER BY source_system')
      .all() as unknown as { source_system: string; c: number; last: string | null }[];
    return rows.map(r => ({ sourceSystem: r.source_system, count: Number(r.c), lastSyncAt: r.last }));
  },
};

// ---------- Misc counts ----------

export function dbCounts(): { tasks: number; blocks: number; sanctions: number; auditLogs: number } {
  const count = (t: string) => {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number };
    return Number(row.c);
  };
  return { tasks: count('tasks'), blocks: count('block_windows'), sanctions: count('sanctions'), auditLogs: count('audit_logs') };
}

// ---------- Reference data (zones / divisions / sections / train movements) ----------

export const referenceRepo = {
  zones() {
    const rows = db.prepare('SELECT * FROM zones ORDER BY code').all() as unknown as {
      code: string; name: string; hq_city: string; route_length_km: number; divisions_count: number;
      asset_availability_pct: number; shadow_efficiency_pct: number; active_defects_count: number;
    }[];
    return rows.map(r => ({
      code: r.code,
      name: r.name,
      hqCity: r.hq_city,
      routeLengthKm: r.route_length_km,
      divisionsCount: r.divisions_count,
      assetAvailabilityPercentage: r.asset_availability_pct,
      shadowEfficiencyPercentage: r.shadow_efficiency_pct,
      activeDefectsCount: r.active_defects_count,
    }));
  },
  divisions() {
    const rows = db.prepare('SELECT * FROM divisions ORDER BY code').all() as unknown as {
      code: string; name: string; zone_code: string; headquarters: string; active_tasks_count: number;
    }[];
    return rows.map(r => ({
      code: r.code,
      name: r.name,
      zoneCode: r.zone_code,
      headquarters: r.headquarters,
      activeTasksCount: r.active_tasks_count,
    }));
  },
  sections() {
    const rows = db.prepare('SELECT * FROM sections ORDER BY id').all() as unknown as Record<string, unknown>[];
    return rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      code: String(r.code),
      zoneCode: String(r.zone_code),
      divisionCode: String(r.division_code),
      corridorName: String(r.corridor_name),
      startStation: String(r.start_station),
      endStation: String(r.end_station),
      lengthKm: Number(r.length_km),
      startKm: Number(r.start_km),
      endKm: Number(r.end_km),
      tracks: Number(r.tracks),
      trafficDensity: String(r.traffic_density),
      dailyTrainCount: Number(r.daily_train_count),
    }));
  },
  trainMovements(): TrainMovement[] {
    const rows = db.prepare('SELECT * FROM train_movements ORDER BY entry_time').all() as unknown as {
      id: string; train_number: string; train_name: string; type: string; section_id: string;
      origin_zone: string; destination_zone: string; entry_time: string; exit_time: string; priority: number;
    }[];
    return rows.map(r => ({
      id: r.id,
      trainNumber: r.train_number,
      trainName: r.train_name,
      type: r.type as TrainMovement['type'],
      sectionId: r.section_id,
      originZone: r.origin_zone,
      destinationZone: r.destination_zone,
      entryTime: r.entry_time,
      exitTime: r.exit_time,
      priority: r.priority,
    }));
  },
};