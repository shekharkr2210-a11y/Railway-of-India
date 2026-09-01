import Database, { type Database as DatabaseInstance } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * SQLite persistence layer (better-sqlite3).
 * Schema is owned here; migrations are idempotent and applied lazily on first use.
 */

let instance: DatabaseInstance | null = null;

export function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const dir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'blockplanner.db');
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS zones (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, hq_city TEXT, route_length_km REAL,
  divisions_count INTEGER, asset_availability_pct REAL, shadow_efficiency_pct REAL, active_defects_count INTEGER
);
CREATE TABLE IF NOT EXISTS divisions (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, zone_code TEXT NOT NULL, headquarters TEXT, active_tasks_count INTEGER
);
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT, zone_code TEXT, division_code TEXT,
  corridor_name TEXT, start_station TEXT, end_station TEXT, length_km REAL, start_km REAL, end_km REAL,
  tracks INTEGER, traffic_density TEXT, daily_train_count INTEGER
);
CREATE TABLE IF NOT EXISTS train_movements (
  id TEXT PRIMARY KEY, train_number TEXT, train_name TEXT, type TEXT NOT NULL, section_id TEXT NOT NULL,
  origin_zone TEXT, destination_zone TEXT, entry_time TEXT NOT NULL, exit_time TEXT NOT NULL, priority INTEGER
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, source_system TEXT NOT NULL, department TEXT NOT NULL, department_name TEXT,
  zone_code TEXT NOT NULL, division_code TEXT NOT NULL, title TEXT NOT NULL, section_id TEXT, section_name TEXT,
  start_km REAL, end_km REAL, estimated_duration_hours REAL, severity TEXT NOT NULL, overdue_days INTEGER,
  requires_power_block INTEGER, speed_restriction_impact_kmvh REAL, criticality_score REAL NOT NULL,
  status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS block_windows (
  id TEXT PRIMARY KEY, zone_code TEXT, division_code TEXT, section_id TEXT, section_name TEXT,
  start_time TEXT, end_time TEXT, duration_hours REAL, is_shadow_block INTEGER, participating_departments TEXT,
  task_ids TEXT, power_block_required INTEGER, bdms_status TEXT, downtime_saved_hours REAL,
  train_impact_minutes INTEGER, horizon TEXT, cross_zonal_impact INTEGER, assigned_machines TEXT,
  scheduled_date TEXT, created_by TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS sanctions (
  id TEXT PRIMARY KEY, block_id TEXT NOT NULL, signed_by TEXT NOT NULL, signed_role TEXT NOT NULL,
  signature TEXT NOT NULL, payload_hash TEXT NOT NULL, payload TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, action TEXT NOT NULL, user_id TEXT, user_role TEXT,
  ip_address TEXT, status TEXT NOT NULL, details TEXT, signature_hash TEXT
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL, zone_code TEXT, division_code TEXT, is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_zone ON tasks(zone_code);
CREATE INDEX IF NOT EXISTS idx_blocks_date ON block_windows(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_logs(timestamp);
`;

export function runMigrations(db: DatabaseInstance): void {
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL);'
  );
  const rows = db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[];
  const applied = new Set(rows.map(r => r.name));
  const sql = SCHEMA_SQL;
  if (!applied.has('0001-initial-schema')) {
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(
        '0001-initial-schema',
        new Date().toISOString()
      );
    })();
  }

  if (!applied.has('0002-source-syncs-and-freight')) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS source_syncs (
          id TEXT PRIMARY KEY,
          source_system TEXT NOT NULL,
          watermark TEXT,
          records_synced INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          error_details TEXT,
          synced_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_syncs_source ON source_syncs(source_system);
      `);
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(
        '0002-source-syncs-and-freight',
        new Date().toISOString()
      );
    })();
  }
}


export function getDb(): DatabaseInstance {
  if (instance) return instance;
  const db = new Database(resolveDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  instance = db;
  return db;
}

export type { Database };