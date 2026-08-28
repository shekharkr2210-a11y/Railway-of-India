import type { Database } from 'better-sqlite3';
import { ensureBootstrapped } from './bootstrap';
import type { Department, MaintenanceTask, TaskSeverity } from './types';
import { INITIAL_MAINTENANCE_TASKS } from './mockData';

/**
 * DB-backed task store. Same public API as before so API routes change minimally,
 * but all data now persists in SQLite. Server-only module.
 */

const db: Database = ensureBootstrapped();

const SELECT_COLS =
  'id, source_system, department, department_name, zone_code, division_code, title, section_id, section_name, ' +
  'start_km, end_km, estimated_duration_hours, severity, overdue_days, requires_power_block, ' +
  'speed_restriction_impact_kmvh, criticality_score, status, created_at, updated_at';

interface TaskRow {
  id: string;
  source_system: string;
  department: string;
  department_name: string;
  zone_code: string;
  division_code: string;
  title: string;
  section_id: string;
  section_name: string;
  start_km: number;
  end_km: number;
  estimated_duration_hours: number;
  severity: string;
  overdue_days: number;
  requires_power_block: number;
  speed_restriction_impact_kmvh: number;
  criticality_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToTask(r: TaskRow): MaintenanceTask {
  return {
    id: r.id,
    sourceSystem: r.source_system as MaintenanceTask['sourceSystem'],
    department: r.department as Department,
    departmentName: r.department_name,
    zoneCode: r.zone_code,
    divisionCode: r.division_code,
    title: r.title,
    sectionId: r.section_id,
    sectionName: r.section_name,
    startKm: r.start_km,
    endKm: r.end_km,
    estimatedDurationHours: r.estimated_duration_hours,
    severity: r.severity as TaskSeverity,
    overdueDays: r.overdue_days,
    requiresPowerBlock: !!r.requires_power_block,
    speedRestrictionImpactKmvh: r.speed_restriction_impact_kmvh,
    criticalityScore: r.criticality_score,
    status: r.status as MaintenanceTask['status'],
  };
}

function taskToParams(t: MaintenanceTask): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: t.id,
    sourceSystem: t.sourceSystem,
    department: t.department,
    departmentName: t.departmentName,
    zoneCode: t.zoneCode,
    divisionCode: t.divisionCode,
    title: t.title,
    sectionId: t.sectionId,
    sectionName: t.sectionName,
    startKm: t.startKm,
    endKm: t.endKm,
    estimatedDurationHours: t.estimatedDurationHours,
    severity: t.severity,
    overdueDays: t.overdueDays,
    requiresPowerBlock: t.requiresPowerBlock ? 1 : 0,
    speedRestrictionImpactKmvh: t.speedRestrictionImpactKmvh,
    criticalityScore: t.criticalityScore,
    status: t.status,
    updatedAt: now,
  };
}

const UPSERT_SQL = `
  INSERT INTO tasks (id, source_system, department, department_name, zone_code, division_code, title, section_id, section_name,
    start_km, end_km, estimated_duration_hours, severity, overdue_days, requires_power_block,
    speed_restriction_impact_kmvh, criticality_score, status, created_at, updated_at)
  VALUES (@id, @sourceSystem, @department, @departmentName, @zoneCode, @divisionCode, @title, @sectionId, @sectionName,
    @startKm, @endKm, @estimatedDurationHours, @severity, @overdueDays, @requiresPowerBlock,
    @speedRestrictionImpactKmvh, @criticalityScore, @status, @createdAt, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    department = excluded.department, department_name = excluded.department_name, zone_code = excluded.zone_code,
    division_code = excluded.division_code, title = excluded.title, section_id = excluded.section_id,
    section_name = excluded.section_name, start_km = excluded.start_km, end_km = excluded.end_km,
    estimated_duration_hours = excluded.estimated_duration_hours, severity = excluded.severity,
    overdue_days = excluded.overdue_days, requires_power_block = excluded.requires_power_block,
    speed_restriction_impact_kmvh = excluded.speed_restriction_impact_kmvh,
    criticality_score = excluded.criticality_score, status = excluded.status, updated_at = excluded.updated_at
`;

class TaskStore {
  public getAll(): MaintenanceTask[] {
    const rows = db.prepare(`SELECT ${SELECT_COLS} FROM tasks ORDER BY created_at DESC`).all() as unknown as TaskRow[];
    return rows.map(rowToTask);
  }

  public getByFilter(filter: {
    zone?: string | null;
    division?: string | null;
    department?: string | null;
    severity?: string | null;
    status?: string | null;
  }): MaintenanceTask[] {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    if (filter.zone && filter.zone !== 'ALL') { clauses.push('zone_code = @zone'); params.zone = filter.zone; }
    if (filter.division && filter.division !== 'ALL') { clauses.push('division_code = @division'); params.division = filter.division; }
    if (filter.department && filter.department !== 'ALL') { clauses.push('department = @department'); params.department = filter.department; }
    if (filter.severity && filter.severity !== 'ALL') { clauses.push('severity = @severity'); params.severity = filter.severity; }
    if (filter.status && filter.status !== 'ALL') { clauses.push('status = @status'); params.status = filter.status; }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT ${SELECT_COLS} FROM tasks ${where} ORDER BY created_at DESC`).all(params) as unknown as TaskRow[];
    return rows.map(rowToTask);
  }

  public getById(id: string): MaintenanceTask | undefined {
    const row = db.prepare(`SELECT ${SELECT_COLS} FROM tasks WHERE id = ?`).get(id) as unknown as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  public add(task: MaintenanceTask): MaintenanceTask {
    const params = taskToParams(task);
    const now = new Date().toISOString();
    // created_at is only written on first insert (the ON CONFLICT clause never touches it)
    db.prepare(UPSERT_SQL).run({ ...params, createdAt: now, updatedAt: now });
    return this.getById(task.id) ?? task;
  }

  public addBatch(tasks: MaintenanceTask[]): MaintenanceTask[] {
    db.transaction((items: MaintenanceTask[]) => {
      for (const t of items) this.add(t);
    })(tasks);
    return tasks;
  }

  public update(id: string, updates: Partial<MaintenanceTask>): MaintenanceTask | null {
    const existing = this.getById(id);
    if (!existing) return null;
    this.add({ ...existing, ...updates, id });
    return this.getById(id) ?? null;
  }

  public delete(id: string): boolean {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public reset(): void {
    db.transaction(() => {
      db.prepare('DELETE FROM tasks').run();
      for (const t of INITIAL_MAINTENANCE_TASKS) {
        this.add(t);
      }
    })();
  }
}

export const taskStore = new TaskStore();
