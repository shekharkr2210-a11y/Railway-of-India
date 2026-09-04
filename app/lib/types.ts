export type Department = 'ENG' | 'TRD' | 'SMMS';

export type TaskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ScopeLevel = 'NATIONAL' | 'ZONE' | 'DIVISION';

export type UserRole = 'BOARD_HQ' | 'ZONAL_GM' | 'DIVISIONAL_DRM' | 'SECTION_CONTROLLER';

export type TrackMachineType = 
  | 'BCM_BALLAST_CLEANER' 
  | 'CSM_TAMPING_MACHINE' 
  | 'TW_TOWER_WAGON' 
  | 'BRM_BALLAST_REGULATOR' 
  | 'USFD_RAIL_TESTER' 
  | 'MANUAL_CREW_GANG';

export interface TCIFeatureBreakdown {
  taskId: string;
  taskTitle: string;
  totalScore: number;
  features: {
    severityScore: number;
    severityMax: number;
    severityLabel: string;
    overdueScore: number;
    overdueMax: number;
    overdueDays: number;
    speedImpactScore: number;
    speedImpactMax: number;
    speedReductionKmph: number;
    trafficDensityScore: number;
    trafficDensityMax: number;
    trafficDensityLevel: string;
    powerBlockScore: number;
    powerBlockMax: number;
    requiresPowerBlock: boolean;
  };
  explanation: string;
  riskFactorSummary: string;
}

export interface WhatIfScenario {
  monsoonWeatherFactor: number;
  freightTrafficSurgePercentage: number;
  speedRestrictionSensitivity: number;
  powerBlockBufferMinutes: number;
}

export interface JointBlockCircular {
  circularNumber: string;
  date: string;
  zoneCode: string;
  divisionCode: string;
  sectionName: string;
  blockWindowId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  trackKmRange: string;
  participatingDepartments: {
    dept: Department;
    deptName: string;
    officerInCharge: string;
    tasksCount: number;
    scope: string;
  }[];
  powerBlockDetails: {
    required: boolean;
    substationCode?: string;
    feederIsolator?: string;
    dischargeRodCrew?: string;
  };
  assignedMachines: {
    machineCode: string;
    machineName: string;
    operatorCrew: string;
  }[];
  concurrenceSignatures: {
    authority: string;
    roleName: string;
    status: 'CONCURRED' | 'SANCTIONED';
    timestamp: string;
    digitalSignature: string;
  }[];
  digitalSealHmac: string;
  status: 'ACTIVE' | 'DRAFT';
}

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

export type TrackDirection = 'UP_MAIN' | 'DN_MAIN' | 'THIRD_LINE' | 'BOTH_DIRECTIONS';

export type SolverType = 'GREEDY_2OPT' | 'PARETO_MULTI_OBJECTIVE';

export interface TSRStage {
  dayNumber: number;
  speedLimitKmph: number;
  sectionalSpeedKmph: number;
  addedDelayMinutesPerTrain: number;
}

export interface TSRRelaxationProfile {
  taskId: string;
  sectionId: string;
  startKm: number;
  endKm: number;
  stages: TSRStage[];
  fullRecoveryDate: string;
}

export interface CrewRosterAssignment {
  gangId: string;
  department: Department;
  crewName: string;
  assignedBlockId: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  restUntil: string;
  isNightShift: boolean;
  hoerCompliant: boolean;
}

export interface MachineFleetUtilization {
  machineCode: string;
  machineName: string;
  machineType: TrackMachineType;
  totalWorkingHours: number;
  idleHours: number;
  transitKm: number;
  utilizationRatePercentage: number;
  assignedCorridors: string[];
}

export interface DisruptionEvent {
  id: string;
  type: 'RAIL_FRACTURE' | 'OHE_BREAKDOWN' | 'SIGNAL_FAILURE' | 'TRAIN_DELAY';
  sectionId: string;
  track: TrackDirection;
  reportedAtKm: number;
  severity: TaskSeverity;
  estimatedResolutionMinutes: number;
  delayMinutesIncurred: number;
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
  track?: TrackDirection;
  estimatedDurationHours: number;
  severity: TaskSeverity;
  overdueDays: number;
  requiresPowerBlock: boolean;
  speedRestrictionImpactKmvh: number;
  criticalityScore: number;
  assignedBlockId?: string;
  assignedMachine?: string;
  assignedMachineType?: TrackMachineType;
  status: 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  dependsOn?: string[];
}

export interface CorridorSection {
  id: string;
  name: string;
  code: string;
  zoneCode: string;
  divisionCode: string;
  corridorName: string;
  startStation: string;
  endStation: string;
  lengthKm: number;
  startKm: number;
  endKm: number;
  tracks: number;
  trackDesignations?: TrackDirection[];
  trafficDensity: 'VERY_HIGH' | 'HIGH' | 'MEDIUM';
  dailyTrainCount: number;
}

export interface TrainMovement {
  id: string;
  trainNumber: string;
  trainName: string;
  type: 'PASSENGER_EXPRESS' | 'FREIGHT_GOODS' | 'PARCEL_SPECIAL';
  sectionId: string;
  track?: TrackDirection;
  originZone: string;
  destinationZone: string;
  entryTime: string;
  exitTime: string;
  priority: number;
}

export interface BlockWindow {
  id: string;
  zoneCode: string;
  divisionCode: string;
  sectionId: string;
  sectionName: string;
  track?: TrackDirection;
  singleLineWorkingActive?: boolean;
  startTime: string;
  endTime: string;
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
  assignedMachines?: string[];
  scheduledDate?: string;
  weekNumber?: number;
  monthName?: string;
  solverType?: SolverType;
  tsrProfile?: TSRRelaxationProfile;
  /** Server-side HMAC signature, populated by the BDMS sanction API. */
  signature?: string;
  /** SHA-256 hash of the signed payload, for tamper verification UI. */
  payloadHash?: string;
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
  unscheduledTasksCount?: number;
}


/** Authenticated user returned by the server session layer and login API. */
export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  zoneCode: string;
  divisionCode: string;
}
