import { getDb } from './db';
import { BlockWindow, OptimizationMetrics, MaintenanceTask, ScopeLevel } from './types';

export interface PlanRecord {
  id: string;
  name: string;
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  scopeLevel: ScopeLevel;
  zoneCode: string | null;
  divisionCode: string | null;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'PUBLISHED' | 'EXECUTED';
  version: number;
  parentPlanId: string | null;
  blocks: BlockWindow[];
  metrics: OptimizationMetrics;
  recommendations: string[];
  unscheduledTasks: MaintenanceTask[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const planStore = {
  savePlan(plan: PlanRecord) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO plans (
        id, name, horizon, scope_level, zone_code, division_code, status, version, parent_plan_id,
        blocks_json, metrics_json, recommendations_json, unscheduled_tasks_json, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        plan.id,
        plan.name,
        plan.horizon,
        plan.scopeLevel,
        plan.zoneCode,
        plan.divisionCode,
        plan.status,
        plan.version,
        plan.parentPlanId,
        JSON.stringify(plan.blocks),
        JSON.stringify(plan.metrics),
        JSON.stringify(plan.recommendations || []),
        JSON.stringify(plan.unscheduledTasks || []),
        plan.createdBy,
        plan.createdAt,
        plan.updatedAt
      );

      // Upsert blocks to block_windows table
      const blockStmt = db.prepare(`
        INSERT OR REPLACE INTO block_windows (
          id, zone_code, division_code, section_id, section_name, start_time, end_time, duration_hours,
          is_shadow_block, participating_departments, task_ids, power_block_required, bdms_status,
          downtime_saved_hours, train_impact_minutes, horizon, cross_zonal_impact, assigned_machines,
          scheduled_date, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const b of plan.blocks) {
        blockStmt.run(
          b.id,
          b.zoneCode,
          b.divisionCode,
          b.sectionId,
          b.sectionName,
          b.startTime,
          b.endTime,
          b.durationHours,
          b.isShadowBlock ? 1 : 0,
          JSON.stringify(b.participatingDepartments),
          JSON.stringify(b.taskIds),
          b.powerBlockRequired ? 1 : 0,
          b.bdmsStatus,
          b.downtimeSavedHours,
          b.trainImpactMinutes,
          b.horizon,
          b.crossZonalImpact ? 1 : 0,
          JSON.stringify(b.assignedMachines || []),
          b.scheduledDate,
          plan.createdBy,
          new Date().toISOString()
        );
      }
    })();
  },

  getPlan(id: string): PlanRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  },

  listPlans(): PlanRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all() as any[];
    return rows.map(r => this.mapRow(r));
  },

  updatePlanStatus(id: string, status: string) {
    const db = getDb();
    db.prepare('UPDATE plans SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      new Date().toISOString(),
      id
    );
  },

  createRevision(originalId: string, newPlan: Partial<PlanRecord>): PlanRecord {
    const original = this.getPlan(originalId);
    if (!original) throw new Error('Original plan not found');
    
    const revisedPlan: PlanRecord = {
      ...original,
      ...newPlan,
      id: `${originalId.split('-v')[0]}-v${original.version + 1}`,
      status: 'DRAFT',
      version: original.version + 1,
      parentPlanId: originalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.savePlan(revisedPlan);
    return revisedPlan;
  },

  mapRow(row: any): PlanRecord {
    return {
      id: row.id,
      name: row.name,
      horizon: row.horizon,
      scopeLevel: row.scope_level,
      zoneCode: row.zone_code,
      divisionCode: row.division_code,
      status: row.status,
      version: row.version,
      parentPlanId: row.parent_plan_id,
      blocks: JSON.parse(row.blocks_json),
      metrics: JSON.parse(row.metrics_json),
      recommendations: JSON.parse(row.recommendations_json || '[]'),
      unscheduledTasks: JSON.parse(row.unscheduled_tasks_json || '[]'),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
};
