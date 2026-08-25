export type Department = 'ENG' | 'TRD' | 'SMMS';

export type TaskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ScopeLevel = 'NATIONAL' | 'ZONE' | 'DIVISION';

export type UserRole = 'BOARD_HQ' | 'ZONAL_GM' | 'DIVISIONAL_DRM' | 'SECTION_CONTROLLER';

export interface ZonalRailway {
  code: string;
  name: string;
  hqCity: string;
  routeLengthKm: number;
  divisionsCount: number;
  assetAvailabilityPercentage: number;
  shadowEfficiencyPercentage: number;
  activeDefectsCount: number;
}

export interface DivisionalUnit {
  code: string;
  name: string;
  zoneCode: string;
  headquarters: string;
  activeTasksCount: number;
}

export interface MaintenanceTask {
  id: string;
  sourceSystem: 'TMS' | 'SMMS' | 'TDMS';
  department: Department;
  departmentName: string;
  zoneCode: string;
  divisionCode: string;
  title: string;
  sectionId: string;
  sectionName: string;
  startKm: number;
  endKm: number;
  estimatedDurationHours: number;
  severity: TaskSeverity;
  overdueDays: number;
  requiresPowerBlock: boolean; // TRD isolation requirement
  speedRestrictionImpactKmvh: number; // impact if delayed
  criticalityScore: number; // Computed AI TCI score 0-100
  assignedBlockId?: string;
  status: 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CorridorSection {
  id: string;
  name: string;
  code: string;
  zoneCode: string;
  divisionCode: string;
  corridorName: string; // e.g. "Delhi - Mumbai Golden Corridor"
  startStation: string;
  endStation: string;
  lengthKm: number;
  startKm: number;
  endKm: number;
  tracks: number; // e.g. 2 for Double Line
  trafficDensity: 'VERY_HIGH' | 'HIGH' | 'MEDIUM';
  dailyTrainCount: number;
}

export interface TrainMovement {
  id: string;
  trainNumber: string;
  trainName: string;
  type: 'PASSENGER_EXPRESS' | 'FREIGHT_GOODS' | 'PARCEL_SPECIAL';
  sectionId: string;
  originZone: string;
  destinationZone: string;
  entryTime: string; // HH:mm
  exitTime: string; // HH:mm
  priority: number; // 1 = highest (e.g. Vande Bharat / Rajdhani)
}

export interface BlockWindow {
  id: string;
  zoneCode: string;
  divisionCode: string;
  sectionId: string;
  sectionName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  isShadowBlock: boolean;
  participatingDepartments: Department[];
  taskIds: string[];
  powerBlockRequired: boolean;
  bdmsStatus: 'PROPOSED' | 'APPROVED' | 'DISPATCHED';
  downtimeSavedHours: number;
  trainImpactMinutes: number;
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  crossZonalImpact: boolean;
}

export interface OptimizationMetrics {
  totalDefects: number;
  criticalTasksCount: number;
  assetAvailabilityPercentage: number;
  totalBlockHoursRequested: number;
  optimizedBlockHoursScheduled: number;
  downtimeHoursSaved: number;
  shadowBlockEfficiency: number;
  trainDelaysPreventedMinutes: number;
  activeZonesCount?: number;
  activeDivisionsCount?: number;
  crossZonalConflictsResolved?: number;
}
