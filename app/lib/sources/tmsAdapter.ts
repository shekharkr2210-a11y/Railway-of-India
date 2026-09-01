import { MaintenanceTask } from '../types';
import { SourceAdapter } from './types';
import { calculateMLCriticality } from '../mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '../mockData';

const TMS_TEMPLATES = [
  {
    title: 'Ultrasonic Flaw (IMR) Defect Detected on High-Speed Rail Joint',
    sectionId: 'SEC-03',
    sectionName: 'MTJ-AGC',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 154,
    endKm: 156,
    durationHours: 2.5,
    severity: 'CRITICAL' as const,
    overdueDays: 5,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 45,
  },
  {
    title: '1:12 Curved Switch Turnout Tongue Rail Profile Machining',
    sectionId: 'SEC-01',
    sectionName: 'NDLS-FZB',
    zoneCode: 'NR',
    divisionCode: 'DLI',
    startKm: 18,
    endKm: 20,
    durationHours: 3.0,
    severity: 'HIGH' as const,
    overdueDays: 3,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 30,
  },
  {
    title: 'Deep Ballast Shoulder Cleaning Machine (BCM) Track Possession',
    sectionId: 'SEC-02',
    sectionName: 'FZB-MTJ',
    zoneCode: 'NR',
    divisionCode: 'DLI',
    startKm: 78,
    endKm: 82,
    durationHours: 3.5,
    severity: 'HIGH' as const,
    overdueDays: 4,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 40,
  },
  {
    title: 'Thermit Weld Flash Butt Grinding & Rail Flange Alignment',
    sectionId: 'SEC-06',
    sectionName: 'CNB-PRYJ',
    zoneCode: 'NCR',
    divisionCode: 'PRYJ',
    startKm: 480,
    endKm: 483,
    durationHours: 2.0,
    severity: 'MEDIUM' as const,
    overdueDays: 2,
    requiresPowerBlock: false,
    speedRestrictionKmvh: 20,
  },
];

export const tmsAdapter: SourceAdapter = {
  sourceSystem: 'TMS',
  name: 'Track Management System (TMS)',
  description: 'Ingests track geometry, IMR ultrasonic rail flaw alerts, and turnout maintenance work orders',

  async fetchUpdates(sinceWatermark?: string) {
    const nextWatermark = `TMS-SYNC-${Date.now()}`;
    const rawTasks: Partial<MaintenanceTask>[] = TMS_TEMPLATES.map((tmpl, idx) => ({
      id: `TMS-GEN-${Date.now().toString(36)}-${idx + 1}`,
      sourceSystem: 'TMS',
      department: 'ENG',
      departmentName: 'Civil Engineering (TMS)',
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
    const department = 'ENG';
    const task: MaintenanceTask = {
      id: raw.id || `TMS-${Date.now()}`,
      sourceSystem: 'TMS',
      department,
      departmentName: raw.departmentName || 'Civil Engineering (Track)',
      zoneCode: raw.zoneCode || 'NCR',
      divisionCode: raw.divisionCode || 'PRYJ',
      title: raw.title || 'Track Defect Rectification',
      sectionId: raw.sectionId || 'SEC-03',
      sectionName: raw.sectionName || 'MTJ-AGC',
      startKm: raw.startKm ?? 150,
      endKm: raw.endKm ?? 154,
      estimatedDurationHours: raw.estimatedDurationHours ?? 2.5,
      severity: raw.severity || 'MEDIUM',
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
