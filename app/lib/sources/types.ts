import { MaintenanceTask, TrainMovement } from '../types';

export type SupportedSource = 'TMS' | 'SMMS' | 'TDMS' | 'COA' | 'BDMS';

export interface SourceSyncResult {
  sourceSystem: SupportedSource;
  watermark: string;
  recordsSynced: number;
  tasksInserted: number;
  trainsUpdated: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  details: string;
  timestamp: string;
  tasks: MaintenanceTask[];
  trains?: TrainMovement[];
}

export interface SourceAdapter {
  sourceSystem: SupportedSource;
  name: string;
  description: string;
  fetchUpdates(sinceWatermark?: string): Promise<{
    watermark: string;
    tasks: Partial<MaintenanceTask>[];
    trains?: TrainMovement[];
  }>;
  mapToCanonicalTask(raw: Partial<MaintenanceTask>): MaintenanceTask;
}

export interface SyncLogEntry {
  id: string;
  sourceSystem: string;
  watermark: string | null;
  recordsSynced: number;
  status: string;
  errorDetails: string | null;
  syncedAt: string;
}
