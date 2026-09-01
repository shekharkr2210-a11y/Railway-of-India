/**
 * Indian Railways Multi-Objective Pareto Optimal Block Planning Solver.
 * Formulates and solves block allocation across multiple competing objectives:
 * Objective 1: Maximize Asset Availability (Minimize Net Corridor Possession Hours)
 * Objective 2: Maximize Shadow Block Downtime Conservation (Cluster Efficiency)
 * Objective 3: Minimize Freight Train Regulation & Sectional Congestion Penalties
 * Objective 4: Maximize High-TCI Critical Defect Fulfillment
 *
 * Subject to Hard Invariants:
 * - Zero Passenger Express Delays (Hard Safety Clearance >= 20 mins)
 * - Exclusive Machine Allocations (No dual-booking of BCM/CSM/TW on same date/time)
 */

import { BlockWindow, CorridorSection, MaintenanceTask, TrainMovement } from '../types';
import { calculateMLCriticality } from '../mlEngine';
import { findWindowsForDate, checkBlockTrainConflict, minutesToTimeString } from '../timetableEngine';

export interface ParetoCandidateSchedule {
  id: string;
  blocks: BlockWindow[];
  unscheduledTasks: MaintenanceTask[];
  objectives: {
    totalDowntimeSavedHours: number;
    freightPenaltyScore: number;
    tciSatisfactionScore: number;
    machineUtilizationScore: number;
  };
  paretoRank: number;
  isDominated: boolean;
}

/**
 * Checks if Candidate A dominates Candidate B in Pareto sense.
 * A dominates B if A is no worse in all objectives and strictly better in at least one.
 */
export function dominates(a: ParetoCandidateSchedule, b: ParetoCandidateSchedule): boolean {
  const betterOrEqualDowntime = a.objectives.totalDowntimeSavedHours >= b.objectives.totalDowntimeSavedHours;
  const betterOrEqualFreight = a.objectives.freightPenaltyScore <= b.objectives.freightPenaltyScore;
  const betterOrEqualTCI = a.objectives.tciSatisfactionScore >= b.objectives.tciSatisfactionScore;
  const betterOrEqualMachine = a.objectives.machineUtilizationScore >= b.objectives.machineUtilizationScore;

  const strictlyBetterInAny =
    a.objectives.totalDowntimeSavedHours > b.objectives.totalDowntimeSavedHours ||
    a.objectives.freightPenaltyScore < b.objectives.freightPenaltyScore ||
    a.objectives.tciSatisfactionScore > b.objectives.tciSatisfactionScore ||
    a.objectives.machineUtilizationScore > b.objectives.machineUtilizationScore;

  return betterOrEqualDowntime && betterOrEqualFreight && betterOrEqualTCI && betterOrEqualMachine && strictlyBetterInAny;
}

/**
 * Computes Pareto Frontiers across multiple schedule permutation configurations.
 */
export function solveParetoOptimalBlocks(
  tasks: MaintenanceTask[],
  sections: CorridorSection[],
  trains: TrainMovement[],
  horizonDays: number = 7,
  startDateStr?: string
): ParetoCandidateSchedule {
  const baseStartDate = startDateStr ? new Date(startDateStr) : new Date();

  // Generate 3 Pareto search configurations with varying spatial clustering radiuses (6km, 8km, 10km)
  const configurations = [
    { name: 'Tight Cluster (6km)', radiusKm: 6, freightBias: 1.2 },
    { name: 'Balanced Spatial (8km)', radiusKm: 8, freightBias: 1.0 },
    { name: 'Broad Horizon (10km)', radiusKm: 10, freightBias: 0.8 },
  ];

  const candidatePool: ParetoCandidateSchedule[] = [];

  configurations.forEach((config, cfgIdx) => {
    const scoredTasks = tasks.map(t => {
      const matchedSection = sections.find(s => s.id === t.sectionId || s.name === t.sectionName);
      return {
        ...t,
        criticalityScore: calculateMLCriticality(t, matchedSection),
      };
    }).sort((a, b) => b.criticalityScore - a.criticalityScore);

    const sectionGroups: Record<string, typeof scoredTasks> = {};
    scoredTasks.forEach(task => {
      if (!sectionGroups[task.sectionId]) sectionGroups[task.sectionId] = [];
      sectionGroups[task.sectionId].push(task);
    });

    const blocks: BlockWindow[] = [];
    const unscheduledTasks: MaintenanceTask[] = [];
    let blockCounter = 301 + cfgIdx * 100;
    const dateMachineBookings = new Map<string, { startM: number; endM: number }[]>();

    const isMachineAvailable = (dateStr: string, code: string, sM: number, eM: number) => {
      const bookings = dateMachineBookings.get(`${dateStr}_${code}`) || [];
      return !bookings.some(b => !(eM <= b.startM || sM >= b.endM));
    };

    const bookMachine = (dateStr: string, code: string, sM: number, eM: number) => {
      const key = `${dateStr}_${code}`;
      const bookings = dateMachineBookings.get(key) || [];
      bookings.push({ startM: sM, endM: eM });
      dateMachineBookings.set(key, bookings);
    };

    let totalDowntimeSaved = 0;
    let totalFreightPenalty = 0;
    let totalTciSatisfied = 0;

    Object.entries(sectionGroups).forEach(([sectionId, secTasks]) => {
      const clusters: MaintenanceTask[][] = [];
      const usedIds = new Set<string>();

      secTasks.forEach(task => {
        if (usedIds.has(task.id)) return;
        const cluster = [task];
        usedIds.add(task.id);

        secTasks.forEach(other => {
          if (!usedIds.has(other.id)) {
            if (Math.abs(task.startKm - other.startKm) <= config.radiusKm) {
              cluster.push(other);
              usedIds.add(other.id);
            }
          }
        });
        clusters.push(cluster);
      });

      clusters.forEach(cluster => {
        const maxDur = Math.max(...cluster.map(t => t.estimatedDurationHours));
        const sumDur = cluster.reduce((a, t) => a + t.estimatedDurationHours, 0);
        const shadowDur = cluster.length > 1 ? maxDur + 0.3 : maxDur;
        const saved = Math.max(0, sumDur - shadowDur);
        const depts = Array.from(new Set(cluster.map(t => t.department)));
        const primary = cluster[0];

        let scheduled = false;

        for (let day = 0; day < horizonDays; day++) {
          const d = new Date(baseStartDate);
          d.setDate(baseStartDate.getDate() + day);
          const dateStr = d.toISOString().split('T')[0];

          const windows = findWindowsForDate(sectionId, dateStr, trains);
          for (const win of windows) {
            const candStart = win.startMinutes;
            const candEnd = candStart + Math.round(shadowDur * 60);
            if (candEnd > win.endMinutes && !win.isOvernightWindow) continue;

            const startStr = minutesToTimeString(candStart);
            const endStr = minutesToTimeString(candEnd);
            const check = checkBlockTrainConflict(sectionId, startStr, endStr, trains);

            if (!check.isHardPassengerViolation) {
              const assignedMachines: string[] = [];
              if (depts.includes('ENG')) {
                const bcm = 'BCM-1';
                if (isMachineAvailable(dateStr, bcm, candStart, candEnd)) {
                  assignedMachines.push('BCM-1 (Ballast Cleaner)');
                  bookMachine(dateStr, bcm, candStart, candEnd);
                }
              }
              if (depts.includes('TRD')) {
                const tw = 'TW-6';
                if (isMachineAvailable(dateStr, tw, candStart, candEnd)) {
                  assignedMachines.push('TW-6 (Tower Wagon)');
                  bookMachine(dateStr, tw, candStart, candEnd);
                }
              }

              blocks.push({
                id: `BLK-PARETO-${blockCounter++}`,
                zoneCode: primary.zoneCode,
                divisionCode: primary.divisionCode,
                sectionId,
                sectionName: primary.sectionName,
                startTime: startStr,
                endTime: endStr,
                durationHours: parseFloat(shadowDur.toFixed(1)),
                isShadowBlock: cluster.length > 1,
                participatingDepartments: depts,
                taskIds: cluster.map(t => t.id),
                powerBlockRequired: cluster.some(t => t.requiresPowerBlock),
                bdmsStatus: 'PROPOSED',
                downtimeSavedHours: parseFloat(saved.toFixed(1)),
                trainImpactMinutes: check.delayRiskMinutes,
                horizon: horizonDays === 1 ? 'DAILY' : horizonDays === 7 ? 'WEEKLY' : 'MONTHLY',
                crossZonalImpact: primary.sectionName.includes('MTJ-AGC') || primary.sectionName.includes('NDLS-FZB'),
                assignedMachines: assignedMachines.length > 0 ? assignedMachines : ['Heavy Track Gang #14'],
                scheduledDate: dateStr,
                solverType: 'PARETO_MULTI_OBJECTIVE',
              });

              totalDowntimeSaved += saved;
              totalFreightPenalty += check.delayRiskMinutes * config.freightBias;
              totalTciSatisfied += cluster.reduce((a, t) => a + t.criticalityScore, 0);
              scheduled = true;
              break;
            }
          }
          if (scheduled) break;
        }

        if (!scheduled) {
          cluster.forEach(t => unscheduledTasks.push(t));
        }
      });
    });

    candidatePool.push({
      id: `CANDIDATE-${config.name}`,
      blocks,
      unscheduledTasks,
      objectives: {
        totalDowntimeSavedHours: parseFloat(totalDowntimeSaved.toFixed(1)),
        freightPenaltyScore: parseFloat(totalFreightPenalty.toFixed(1)),
        tciSatisfactionScore: Math.round(totalTciSatisfied),
        machineUtilizationScore: blocks.filter(b => b.assignedMachines && b.assignedMachines.length > 0).length * 15,
      },
      paretoRank: 1,
      isDominated: false,
    });
  });

  // Calculate Pareto Dominance
  for (let i = 0; i < candidatePool.length; i++) {
    for (let j = 0; j < candidatePool.length; j++) {
      if (i !== j && dominates(candidatePool[j], candidatePool[i])) {
        candidatePool[i].isDominated = true;
        candidatePool[i].paretoRank += 1;
      }
    }
  }

  // Pick top non-dominated candidate with best downtime conservation and TCI score
  const nonDominated = candidatePool.filter(c => !c.isDominated);
  const bestCandidate = nonDominated.sort((a, b) => 
    (b.objectives.totalDowntimeSavedHours * 20 + b.objectives.tciSatisfactionScore) - 
    (a.objectives.totalDowntimeSavedHours * 20 + a.objectives.tciSatisfactionScore)
  )[0] || candidatePool[0];

  return bestCandidate;
}
