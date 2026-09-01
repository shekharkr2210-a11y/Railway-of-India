import { MaintenanceTask } from '../types';
import { SourceAdapter } from './types';
import { calculateMLCriticality } from '../mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '../mockData';

const SMMS_TEMPLATES = [
  {
    title: 'Point Machine 104-B Internal Motor Overhaul & Throw Calibration',
    sectionId: 'SEC-03',
    sectionName: 'MTJ-AGC',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 154,
    endKm: 155,
    durationHours: 1.5,
    severity: 'HIGH' as const,
    overdueDays: 2,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 15,
  },
  {
    title: 'Kavach Automatic Train Protection (ATP) Track RFID Sensor Calibration',
    sectionId: 'SEC-06',
    sectionName: 'CNB-PRYJ',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 479,
    endKm: 481,
    durationHours: 1.8,
    severity: 'CRITICAL' as const,
    overdueDays: 3,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 25,
  },
  {
    title: 'High-Frequency Digital Axle Counter Multi-Section Health Diagnostic',
    sectionId: 'SEC-12',
    sectionName: 'ST-MMCT',
    zoneCode: 'WR',
    divisionCode: 'MMCT',
    startKm: 1312,
    endKm: 1314,
    durationHours: 2.0,
    severity: 'HIGH' as const,
    overdueDays: 1,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 20,
  },
];

export const smmsAdapter: SourceAdapter = {
  sourceSystem: 'SMMS',
  name: 'Signalling Maintenance Management System (SMMS)',
  description: 'Ingests point machine telemetry, axle counters, Kavach ATP tags, and signal interlocking alarms',

  async fetchUpdates(sinceWatermark?: string) {
    const nextWatermark = `SMMS-SYNC-${Date.now()}`;
    const rawTasks: Partial<MaintenanceTask>[] = SMMS_TEMPLATES.map((tmpl, idx) => ({
      id: `SMMS-GEN-${Date.now().toString(36)}-${idx + 1}`,
      sourceSystem: 'SMMS',
      department: 'SMMS',
      departmentName: 'Signal & Telecommunication (SMMS)',
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
    const department = 'SMMS';
    const task: MaintenanceTask = {
      id: raw.id || `SMMS-${Date.now()}`,
      sourceSystem: 'SMMS',
      department,
      departmentName: raw.departmentName || 'Signal & Telecom',
      zoneCode: raw.zoneCode || 'NCR',
      divisionCode: raw.divisionCode || 'PRYJ',
      title: raw.title || 'Signalling Asset Maintenance',
      sectionId: raw.sectionId || 'SEC-03',
      sectionName: raw.sectionName || 'MTJ-AGC',
      startKm: raw.startKm ?? 154,
      endKm: raw.endKm ?? 155,
      estimatedDurationHours: raw.estimatedDurationHours ?? 1.5,
      severity: raw.severity || 'HIGH',
      overdueDays: raw.overdueDays ?? 0,
      requiresPowerBlock: Boolean(raw.requiresPowerBlock),
      speedRestrictionImpactKmvh: raw.speedRestrictionImpactKmvh ?? 0,
      criticalityScore: 50,
      status: raw.status || 'PENDING',
    };

    const section = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === task.sectionId || s.name === task.sectionName);
    task.criticalityScore = calculateMLCriticality(task, section);
    return task;
  },
};
