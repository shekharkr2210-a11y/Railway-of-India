import { parseCSV } from '../csvParser';
import { MaintenanceTask, TrainMovement } from '../types';
import { SourceAdapter } from './types';

const COA_TRAIN_TEMPLATES: TrainMovement[] = [
  {
    id: 'TRN-G8895',
    trainNumber: 'G-8895',
    trainName: 'Dedicated Freight Corridor Long-Haul Container Rake',
    type: 'FREIGHT_GOODS',
    sectionId: 'SEC-03',
    originZone: 'WR',
    destinationZone: 'NCR',
    entryTime: '13:00',
    exitTime: '14:15',
    priority: 3,
  },
  {
    id: 'TRN-C4418',
    trainNumber: 'C-4418',
    trainName: 'NTPC Super-Thermal Power Coal Shuttle Rake',
    type: 'FREIGHT_GOODS',
    sectionId: 'SEC-06',
    originZone: 'SECR',
    destinationZone: 'NCR',
    entryTime: '15:30',
    exitTime: '17:00',
    priority: 3,
  },
  {
    id: 'TRN-22438',
    trainNumber: '22438',
    trainName: 'Vande Bharat Express (PRYJ - NDLS)',
    type: 'PASSENGER_EXPRESS',
    sectionId: 'SEC-06',
    originZone: 'NCR',
    destinationZone: 'NR',
    entryTime: '15:00',
    exitTime: '16:20',
    priority: 1,
  },
];

export const coaAdapter: SourceAdapter = {
  sourceSystem: 'COA',
  name: 'Control Office Application (COA)',
  description: 'Ingests active train movements, freight rake dispatches, and temporary speed restrictions',

  async fetchUpdates(sinceWatermark?: string) {
    const nextWatermark = `COA-SYNC-${Date.now()}`;
    return {
      watermark: nextWatermark,
      tasks: [],
      trains: COA_TRAIN_TEMPLATES,
    };
  },

  mapToCanonicalTask(raw: Partial<MaintenanceTask>): MaintenanceTask {
    return {
      id: raw.id || `COA-${Date.now()}`,
      sourceSystem: 'TMS',
      department: 'ENG',
      departmentName: 'Traffic Operations',
      zoneCode: raw.zoneCode || 'NCR',
      divisionCode: raw.divisionCode || 'PRYJ',
      title: raw.title || 'Operational Work Order',
      sectionId: raw.sectionId || 'SEC-01',
      sectionName: raw.sectionName || 'NDLS-FZB',
      startKm: raw.startKm ?? 0,
      endKm: raw.endKm ?? 10,
      estimatedDurationHours: raw.estimatedDurationHours ?? 1.0,
      severity: 'LOW',
      overdueDays: 0,
      requiresPowerBlock: false,
      speedRestrictionImpactKmvh: 0,
      criticalityScore: 30,
      status: 'PENDING',
    };
  },

  parseFromCSV(csvContent: string): TrainMovement[] {
    const parsed = parseCSV<TrainMovement>(csvContent, {
      columnMapping: {
        train_number: 'trainNumber',
        train_name: 'trainName',
        type: 'type',
        section_id: 'sectionId',
        origin_zone: 'originZone',
        destination_zone: 'destinationZone',
        entry_time: 'entryTime',
        exit_time: 'exitTime',
        priority: 'priority'
      },
      transform: (row) => ({
        id: `TRN-${row.trainNumber || Math.floor(Math.random() * 10000)}-${Date.now()}`,
        priority: parseInt(row.priority as string, 10) || 1
      })
    });
    return parsed.data;
  },
};
