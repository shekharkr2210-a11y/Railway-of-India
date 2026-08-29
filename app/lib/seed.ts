import type { Database } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import {
  ZONAL_RAILWAYS,
  DIVISIONAL_UNITS,
  INITIAL_CORRIDOR_SECTIONS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_TRAIN_MOVEMENTS,
} from './mockData';

/**
 * Idempotent seed of reference + demo data into the SQLite database.
 * Only inserts when the target table is empty. Server-only module.
 */

function countRows(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number };
  return Number(row.c);
}

function seedZonesAndDivisions(db: Database.Database): void {
  if (countRows(db, 'zones') === 0) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO zones (code, name, hq_city, route_length_km, divisions_count, asset_availability_pct, shadow_efficiency_pct, active_defects_count)
       VALUES (@code, @name, @hqCity, @routeLengthKm, @divisionsCount, @assetAvailabilityPercentage, @shadowEfficiencyPercentage, @activeDefectsCount)`
    );
    db.transaction((rows: typeof ZONAL_RAILWAYS) => {
      for (const z of rows) ins.run(z);
    })(ZONAL_RAILWAYS);
  }
  if (countRows(db, 'divisions') === 0) {
    const ins = db.prepare(
      `INSERT OR IGNORE INTO divisions (code, name, zone_code, headquarters, active_tasks_count)
       VALUES (@code, @name, @zoneCode, @headquarters, @activeTasksCount)`
    );
    db.transaction((rows: typeof DIVISIONAL_UNITS) => {
      for (const d of rows) ins.run(d);
    })(DIVISIONAL_UNITS);
  }
}

function seedSections(db: Database.Database): void {
  if (countRows(db, 'sections') > 0) return;
  const ins = db.prepare(
    `INSERT OR IGNORE INTO sections (id, name, code, zone_code, division_code, corridor_name, start_station, end_station, length_km, start_km, end_km, tracks, traffic_density, daily_train_count)
     VALUES (@id, @name, @code, @zoneCode, @divisionCode, @corridorName, @startStation, @endStation, @lengthKm, @startKm, @endKm, @tracks, @trafficDensity, @dailyTrainCount)`
  );
  db.transaction((rows: typeof INITIAL_CORRIDOR_SECTIONS) => {
    for (const s of rows) ins.run(s);
  })(INITIAL_CORRIDOR_SECTIONS);
}

function seedTrainMovements(db: Database.Database): void {
  if (countRows(db, 'train_movements') > 0) return;
  const ins = db.prepare(
    `INSERT OR IGNORE INTO train_movements (id, train_number, train_name, type, section_id, origin_zone, destination_zone, entry_time, exit_time, priority)
     VALUES (@id, @trainNumber, @trainName, @type, @sectionId, @originZone, @destinationZone, @entryTime, @exitTime, @priority)`
  );
  db.transaction((rows: typeof INITIAL_TRAIN_MOVEMENTS) => {
    for (const t of rows) ins.run(t);
  })(INITIAL_TRAIN_MOVEMENTS);
}

function seedTasks(db: Database.Database): void {
  if (countRows(db, 'tasks') > 0) return;
  const ins = db.prepare(
    `INSERT OR IGNORE INTO tasks (id, source_system, department, department_name, zone_code, division_code, title, section_id, section_name,
       start_km, end_km, estimated_duration_hours, severity, overdue_days, requires_power_block, speed_restriction_impact_kmvh, criticality_score, status, created_at, updated_at)
     VALUES (@id, @sourceSystem, @department, @departmentName, @zoneCode, @divisionCode, @title, @sectionId, @sectionName,
       @startKm, @endKm, @estimatedDurationHours, @severity, @overdueDays, @requiresPowerBlock, @speedRestrictionImpactKmvh, @criticalityScore, @status, @createdAt, @updatedAt)`
  );
  const now = new Date().toISOString();
  db.transaction((rows: typeof INITIAL_MAINTENANCE_TASKS) => {
    for (const t of rows) {
      ins.run({
        ...t,
        // booleans are stored as integers in the schema
        requiresPowerBlock: t.requiresPowerBlock ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  })(INITIAL_MAINTENANCE_TASKS);
}

export function createDefaultAdmin(db: Database.Database): void {
  if (countRows(db, 'users') > 0) return;
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_PASSWORD must be set in production to create the initial admin user.');
  }
  const password = process.env.SEED_ADMIN_PASSWORD || 'dev-admin1234';
  const name = process.env.SEED_ADMIN_NAME || 'System Administrator';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@indianrailways.gov.in';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, zone_code, division_code, is_active, created_at)
     VALUES (?, ?, ?, ?, 'BOARD_HQ', '', '', 1, ?)`
  ).run(`user-${Date.now()}-admin`, name, email, hash, new Date().toISOString());

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[seed] Created default admin (${email}) with the dev password. Set SEED_ADMIN_PASSWORD and rotate before production.`
    );
  }
}

export function seedIfEmpty(db: Database.Database): void {
  seedZonesAndDivisions(db);
  seedSections(db);
  seedTrainMovements(db);
  seedTasks(db);
  createDefaultAdmin(db);
}