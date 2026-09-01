import { MaintenanceTask } from '../types';
import { SourceAdapter } from './types';
import { calculateMLCriticality } from '../mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '../mockData';

const TDMS_TEMPLATES = [
  {
    title: '25kV Contact Wire Wear Replacement & Cantilever Stagger Tuning',
    sectionId: 'SEC-03',
    sectionName: 'MTJ-AGC',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 153,
    endKm: 157,
    durationHours: 2.0,
    severity: 'CRITICAL' as const,
    overdueDays: 4,
    requiresPowerBlock: true,
    speedRestrictionKmvh: 20,
  },
  {
    title: 'OHE Neutral Section Isolator Testing & Tower Wagon Inspection',
    sectionId: 'SEC-06',
    sectionName: 'CNB-PRYJ',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 480,
    endKm: 484,
    durationHours: 2.2,
    severity: 'HIGH' as const,
    overdueDays: 2,
    requiresPowerBlock: true,
    speedRestrictionKmvh: 15,
  },
  {
    title: 'AC Traction Substation Feeder Circuit Breaker Thermal Scan',
    sectionId: 'SEC-02',
    sectionName: 'FZB-MTJ',
    zoneCode: 'NR',
    divisionCode: 'DLI',
    startKm: 76,
    endKm: 79,
    durationHours: 2.5,
    severity: 'MEDIUM' as const,
    overdueDays: 3,
    requiresPowerBlock: true,
    speedRestrictionKmvh: 10,
  },
];

export const tdmsAdapter: SourceAdapter = {
  sourceSystem: 'TDMS',
  name: 'Traction Distribution Management System (TDMS)',
  description: 'Ingests 25kV OHE electrical catenary wire wear, isolator thermal scans, and power block requirements',

  async fetchUpdates(sinceWatermark?: string) {
    const nextWatermark = `TDMS-SYNC-${Date.now()}`;
    const rawTasks: Partial<MaintenanceTask>[] = TDMS_TEMPLATES.map((tmpl, idx) => ({
      id: `TDMS-GEN-${Date.now().toString(36)}-${idx + 1}`,
      sourceSystem: 'TDMS',
      department: 'TRD',
      departmentName: 'Traction Distribution (TDMS)',
      zoneCode: tmpl.zoneCode,
      divisionCode: tmpl.divisionCode,
      title: tmpl.title,
      sectionId: tmpl.sectionId,
      sectionName: tmpl.sectionName,
      startKm: tmpl.startKm,
      endKm: tmpl.endKm,
      estimatedDurationHours: tmpl.durationHours,
      severity: tmpl.severity,
      overdueDays: tmpl.overdueDays,
      requiresPowerBlock: tmpl.requiresPowerBlock,
      speedRestrictionImpactKmvh: tmpl.speedRestrictionKmvh,
      status: 'PENDING',
    }));

    return {
      watermark: nextWatermark,
      tasks: rawTasks,
    };
  },

  mapToCanonicalTask(raw: Partial<MaintenanceTask>): MaintenanceTask {
    const department = 'TRD';
    const task: MaintenanceTask = {
      id: raw.id || `TDMS-${Date.now()}`,
      sourceSystem: 'TDMS',
      department,
      departmentName: raw.departmentName || 'Traction Distribution (OHE)',
      zoneCode: raw.zoneCode || 'NCR',
      divisionCode: raw.divisionCode || 'PRYJ',
      title: raw.title || '25kV OHE Traction Maintenance',
      sectionId: raw.sectionId || 'SEC-03',
      sectionName: raw.sectionName || 'MTJ-AGC',
      startKm: raw.startKm ?? 153,
      endKm: raw.endKm ?? 157,
      estimatedDurationHours: raw.estimatedDurationHours ?? 2.0,
      severity: raw.severity || 'HIGH',
      overdueDays: raw.overdueDays ?? 0,
      requiresPowerBlock: true,
      speedRestrictionImpactKmvh: raw.speedRestrictionImpactKmvh ?? 0,
      criticalityScore: 50,
      status: raw.status || 'PENDING',
    };

    const section = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === task.sectionId || s.name === task.sectionName);
    task.criticalityScore = calculateMLCriticality(task, section);
    return task;
  },
};
