/**
 * Indian Railways Track Maintenance Machinery Fleet Analytics Engine.
 * Computes asset utilization, working vs idle ratios, and inter-corridor transit logistics
 * for specialized track machinery (BCM, CSM, Tower Wagons, USFD).
 */

import { BlockWindow, MachineFleetUtilization, TrackMachineType } from './types';

const MACHINE_REGISTRY: Array<{
  code: string;
  name: string;
  type: TrackMachineType;
  baseStation: string;
}> = [
  { code: 'BCM-1', name: 'Plasser BCM-330 Ballast Cleaner', type: 'BCM_BALLAST_CLEANER', baseStation: 'MTJ' },
  { code: 'BCM-2', name: 'Plasser BCM-330 Ballast Cleaner #2', type: 'BCM_BALLAST_CLEANER', baseStation: 'NDLS' },
  { code: 'BCM-3', name: 'Plasser BCM High-Output Cleaner #3', type: 'BCM_BALLAST_CLEANER', baseStation: 'CNB' },
  { code: 'CSM-10', name: '09-3X Continuous Action Tamping Machine', type: 'CSM_TAMPING_MACHINE', baseStation: 'AGC' },
  { code: 'CSM-11', name: 'Duomatic Tamping Express 08-32', type: 'CSM_TAMPING_MACHINE', baseStation: 'TDL' },
  { code: 'CSM-12', name: 'Unimat 08-475 4S Switch Tamper', type: 'CSM_TAMPING_MACHINE', baseStation: 'DLI' },
  { code: 'TW-6', name: '8-Wheeler Self-Propelled Tower Wagon #6', type: 'TW_TOWER_WAGON', baseStation: 'MTJ' },
  { code: 'TW-7', name: '8-Wheeler TRD Inspection Wagon #7', type: 'TW_TOWER_WAGON', baseStation: 'PWL' },
  { code: 'TW-8', name: 'BEML 8-Wheeler High-Speed Tower Car #8', type: 'TW_TOWER_WAGON', baseStation: 'PRYJ' },
  { code: 'USFD-1', name: 'Sperry Digital Rail Flaw Tester #1', type: 'USFD_RAIL_TESTER', baseStation: 'NDLS' },
  { code: 'USFD-2', name: 'EEC Dual-Rail Ultrasonic Tester #2', type: 'USFD_RAIL_TESTER', baseStation: 'CNB' },
  { code: 'SMMS-RIG-1', name: 'Point Machine Calibration Rig #1', type: 'MANUAL_CREW_GANG', baseStation: 'AGC' },
];

/**
 * Computes fleet utilization metrics across all scheduled block windows for a given horizon.
 */
export function calculateFleetUtilization(
  blocks: BlockWindow[],
  sectionsOrHorizon: import('./types').CorridorSection[] | number = [],
  horizonDays: number = 7
): {
  fleet: MachineFleetUtilization[];
  overallUtilizationPercentage: number;
  totalFleetOperatingHours: number;
  totalTransitKm: number;
} {
  const sections = Array.isArray(sectionsOrHorizon) ? sectionsOrHorizon : [];
  const effectiveHorizonDays = typeof sectionsOrHorizon === 'number' ? sectionsOrHorizon : horizonDays;
  const totalAvailableShiftHoursPerMachine = effectiveHorizonDays * 6; // Standard 6h target availability per day

  const fleetMap = new Map<string, {
    workingHours: number;
    assignedCorridors: Set<string>;
    transitKm: number;
  }>();

  // Initialize
  MACHINE_REGISTRY.forEach(m => {
    fleetMap.set(m.code, {
      workingHours: 0,
      assignedCorridors: new Set<string>(),
      transitKm: 0,
    });
  });

  // Helper map to quickly get section length
  const sectionLengths = new Map<string, number>();
  sections.forEach(s => {
    sectionLengths.set(s.name, s.lengthKm || 28);
  });

  // Track block allocations
  blocks.forEach(b => {
    if (!b.assignedMachines) return;
    for (const machineDesc of b.assignedMachines) {
      const match = MACHINE_REGISTRY.find(m => machineDesc.includes(m.code));
      if (match) {
        const stats = fleetMap.get(match.code)!;
        stats.workingHours += b.durationHours;
        
        if (!stats.assignedCorridors.has(b.sectionName)) {
          stats.assignedCorridors.add(b.sectionName);
          // Calculate transit km based on actual corridor length, fallback to 28
          const len = sectionLengths.get(b.sectionName) || 28;
          stats.transitKm += len;
        }
      }
    }
  });

  let totalWorkingHours = 0;
  let totalTransit = 0;

  const fleet: MachineFleetUtilization[] = MACHINE_REGISTRY.map(m => {
    const stats = fleetMap.get(m.code)!;
    const working = parseFloat(stats.workingHours.toFixed(1));
    const idle = Math.max(0, parseFloat((totalAvailableShiftHoursPerMachine - working).toFixed(1)));
    const utilRate = parseFloat(Math.min(100, (working / totalAvailableShiftHoursPerMachine) * 100).toFixed(1));

    totalWorkingHours += working;
    totalTransit += stats.transitKm;

    return {
      machineCode: m.code,
      machineName: m.name,
      machineType: m.type,
      totalWorkingHours: working,
      idleHours: idle,
      transitKm: stats.transitKm,
      utilizationRatePercentage: utilRate,
      assignedCorridors: Array.from(stats.assignedCorridors),
    };
  });

  const totalPossible = MACHINE_REGISTRY.length * totalAvailableShiftHoursPerMachine;
  const overallUtil = parseFloat(Math.min(100, (totalWorkingHours / (totalPossible || 1)) * 100).toFixed(1));

  return {
    fleet,
    overallUtilizationPercentage: overallUtil,
    totalFleetOperatingHours: parseFloat(totalWorkingHours.toFixed(1)),
    totalTransitKm: totalTransit,
  };
}
