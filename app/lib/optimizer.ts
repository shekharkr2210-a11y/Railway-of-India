import { MaintenanceTask, BlockWindow, OptimizationMetrics, ScopeLevel, CorridorSection, TrainMovement } from './types';
import { calculateMLCriticality, generateAIRecommendations } from './mlEngine';
import { findWindowsForDate, checkBlockTrainConflict, minutesToTimeString, timeStringToMinutes } from './timetableEngine';
import { computeOptimizationMetrics } from './metrics';
import { INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from './mockData';

export function calculateTaskCriticality(task: MaintenanceTask, section?: CorridorSection): number {
  return calculateMLCriticality(task, section);
}

/**
 * AI-Powered Automatic Block Planning & Multi-Objective Constraint Optimization Engine.
 * Integrates TMS/SMMS/TDMS maintenance work orders with Train Timetable Headways.
 * Synthesizes clash-free multi-department Shadow Blocks across Daily, Weekly, and Monthly horizons.
 */
export function generateOptimizedBlocks(
  allTasks: MaintenanceTask[],
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY',
  scopeLevel: ScopeLevel = 'NATIONAL',
  selectedZone: string = 'ALL',
  selectedDivision: string = 'ALL',
  corridorSections: CorridorSection[] = INITIAL_CORRIDOR_SECTIONS,
  trainMovements: TrainMovement[] = INITIAL_TRAIN_MOVEMENTS,
  startDateStr?: string
): {
  blocks: BlockWindow[];
  metrics: OptimizationMetrics;
  recommendations: string[];
  unscheduledTasks: MaintenanceTask[];
} {
  // 1. Filter tasks by Geographic Scope (National / Zone / Division)
  let filteredTasks = [...allTasks];

  if (scopeLevel === 'ZONE' && selectedZone !== 'ALL') {
    filteredTasks = filteredTasks.filter(t => t.zoneCode === selectedZone);
  } else if (scopeLevel === 'DIVISION' && selectedDivision !== 'ALL') {
    filteredTasks = filteredTasks.filter(t => t.divisionCode === selectedDivision);
  }

  // 2. Compute AI Track Criticality Index (TCI 2.0) for each task using calibrated ML model
  const scoredTasks = filteredTasks.map(t => {
    const matchedSection = corridorSections.find(s => s.id === t.sectionId || s.name === t.sectionName);
    return {
      ...t,
      criticalityScore: calculateMLCriticality(t, matchedSection),
    };
  }).sort((a, b) => b.criticalityScore - a.criticalityScore);

  // 3. Partition tasks by corridor section
  const sectionGroups: Record<string, typeof scoredTasks> = {};
  scoredTasks.forEach(task => {
    if (!sectionGroups[task.sectionId]) {
      sectionGroups[task.sectionId] = [];
    }
    sectionGroups[task.sectionId].push(task);
  });

  const generatedBlocks: BlockWindow[] = [];
  const unscheduledTasks: MaintenanceTask[] = [];

  let blockCounter = 101;
  const horizonDays = horizon === 'DAILY' ? 1 : horizon === 'WEEKLY' ? 7 : 30;
  const baseStartDate = startDateStr ? new Date(startDateStr) : new Date();

  // Date-Aware Machinery Booking Timeline: Map of `${date}_${machineCode}` -> { startM, endM }[]
  const dateMachineBookings = new Map<string, { startM: number; endM: number }[]>();

  // Helper to check machine availability on a specific date
  const isMachineAvailableOnDate = (dateStr: string, machineCode: string, startM: number, endM: number): boolean => {
    const key = `${dateStr}_${machineCode}`;
    const bookings = dateMachineBookings.get(key) || [];
    return !bookings.some(b => !(endM <= b.startM || startM >= b.endM));
  };

  const registerMachineBooking = (dateStr: string, machineCode: string, startM: number, endM: number) => {
    const key = `${dateStr}_${machineCode}`;
    const bookings = dateMachineBookings.get(key) || [];
    bookings.push({ startM, endM });
    dateMachineBookings.set(key, bookings);
  };

  // 4. Multi-Department Spatial Clustering & Multi-Day Headway Slotting per Section
  Object.entries(sectionGroups).forEach(([sectionId, sectionTasks]) => {
    const clusters: MaintenanceTask[][] = [];
    const usedTaskIds = new Set<string>();

    // Spatial clustering: Group tasks in the same section with startKm delta <= 8 km
    sectionTasks.forEach(task => {
      if (usedTaskIds.has(task.id)) return;

      const cluster: MaintenanceTask[] = [task];
      usedTaskIds.add(task.id);

      sectionTasks.forEach(other => {
        if (!usedTaskIds.has(other.id)) {
          const kmOverlap = Math.abs(task.startKm - other.startKm) <= 8;
          if (kmOverlap) {
            cluster.push(other);
            usedTaskIds.add(other.id);
          }
        }
      });

      clusters.push(cluster);
    });

    // 5. Schedule each cluster across the horizon days Earliest-Deadline-First
    clusters.forEach((cluster, clusterIdx) => {
      const sumIndividual = cluster.reduce((acc, t) => acc + t.estimatedDurationHours, 0);
      const maxIndividual = Math.max(...cluster.map(t => t.estimatedDurationHours));
      
      // Shadow Block duration: max individual duration + 0.3h setup/isolation buffer
      const shadowBlockDuration = cluster.length > 1 ? maxIndividual + 0.3 : maxIndividual;
      const downtimeSaved = Math.max(0, sumIndividual - shadowBlockDuration);

      const depts = Array.from(new Set(cluster.map(t => t.department)));
      const needsPower = cluster.some(t => t.requiresPowerBlock);
      const primaryTask = cluster[0];

      let scheduled = false;

      // Iterate through each date in the planning horizon
      for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
        const currentDate = new Date(baseStartDate);
        currentDate.setDate(baseStartDate.getDate() + dayOffset);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Sweep available headway windows on this date
        const headwayWindows = findWindowsForDate(sectionId, dateStr, trainMovements);

        // Sort headway windows by best fit (smallest window >= block duration, lowest freight impact)
        const sortedWindows = [...headwayWindows].sort((a, b) => {
          const durA = a.endMinutes - a.startMinutes;
          const durB = b.endMinutes - b.startMinutes;
          if (a.freightImpactScore !== b.freightImpactScore) {
            return a.freightImpactScore - b.freightImpactScore;
          }
          return durA - durB;
        });

        for (const window of sortedWindows) {
          const candidateStart = window.startMinutes;
          const candidateEnd = candidateStart + Math.round(shadowBlockDuration * 60);

          if (candidateEnd > window.endMinutes && !window.isOvernightWindow) continue;

          const startTimeStr = minutesToTimeString(candidateStart);
          const endTimeStr = minutesToTimeString(candidateEnd);

          const conflictCheck = checkBlockTrainConflict(sectionId, startTimeStr, endTimeStr, trainMovements);

          // HARD SAFETY CONSTRAINT INVARIANT: Passenger trains must NEVER be delayed
          if (!conflictCheck.isHardPassengerViolation) {
            // Assign track maintenance machines
            const assignedMachines: string[] = [];

            if (depts.includes('ENG')) {
              const isHeavyTrackWork = cluster.some(t => 
                t.title.toLowerCase().includes('renewal') || 
                t.title.toLowerCase().includes('ballast') || 
                t.title.toLowerCase().includes('weld') || 
                t.title.toLowerCase().includes('fracture') ||
                t.title.toLowerCase().includes('tamping')
              );
              if (isHeavyTrackWork) {
                const bcmCode = `BCM-${(clusterIdx % 3) + 1}`;
                if (isMachineAvailableOnDate(dateStr, bcmCode, candidateStart, candidateEnd)) {
                  assignedMachines.push(`${bcmCode} (Ballast Cleaner)`);
                  registerMachineBooking(dateStr, bcmCode, candidateStart, candidateEnd);
                }

                const csmCode = `CSM-${(clusterIdx % 4) + 10}`;
                if (isMachineAvailableOnDate(dateStr, csmCode, candidateStart, candidateEnd)) {
                  assignedMachines.push(`${csmCode} (Tamping Machine)`);
                  registerMachineBooking(dateStr, csmCode, candidateStart, candidateEnd);
                }
              } else {
                const usfdCode = `USFD-${(clusterIdx % 4) + 1}`;
                if (isMachineAvailableOnDate(dateStr, usfdCode, candidateStart, candidateEnd)) {
                  assignedMachines.push(`${usfdCode} (Ultrasonic Flaw Tester)`);
                  registerMachineBooking(dateStr, usfdCode, candidateStart, candidateEnd);
                }
              }
            }

            if (depts.includes('TRD')) {
              const twCode = `TW-${(clusterIdx % 3) + 6}`;
              if (isMachineAvailableOnDate(dateStr, twCode, candidateStart, candidateEnd)) {
                assignedMachines.push(`${twCode} (8-Wheeler Tower Wagon)`);
                registerMachineBooking(dateStr, twCode, candidateStart, candidateEnd);
              }
            }

            if (depts.includes('SMMS')) {
              const smmsRigCode = `SMMS-RIG-${(clusterIdx % 3) + 1}`;
              if (isMachineAvailableOnDate(dateStr, smmsRigCode, candidateStart, candidateEnd)) {
                assignedMachines.push(`${smmsRigCode} (Point Machine Calibration Rig)`);
                registerMachineBooking(dateStr, smmsRigCode, candidateStart, candidateEnd);
              }
            }


            // Cross-zonal corridor detection
            const isCrossZonal = primaryTask.sectionName.includes('MTJ-AGC') || 
                                 primaryTask.sectionName.includes('ST-MMCT') ||
                                 primaryTask.sectionName.includes('NDLS-FZB') ||
                                 primaryTask.sectionName.includes('CNB-PRYJ');

            // Calculate weekNumber (1-5) and monthName
            const weekNumber = Math.min(5, Math.floor(dayOffset / 7) + 1);
            const monthName = currentDate.toLocaleString('default', { month: 'long' });

            const block: BlockWindow = {
              id: `BLK-${primaryTask.zoneCode}-${blockCounter++}`,
              zoneCode: primaryTask.zoneCode,
              divisionCode: primaryTask.divisionCode,
              sectionId,
              sectionName: primaryTask.sectionName,
              startTime: startTimeStr,
              endTime: endTimeStr,
              durationHours: parseFloat(shadowBlockDuration.toFixed(1)),
              isShadowBlock: cluster.length > 1,
              participatingDepartments: depts,
              taskIds: cluster.map(t => t.id),
              powerBlockRequired: needsPower,
              bdmsStatus: 'PROPOSED',
              downtimeSavedHours: parseFloat(downtimeSaved.toFixed(1)),
              trainImpactMinutes: conflictCheck.delayRiskMinutes,
              horizon,
              crossZonalImpact: isCrossZonal,
              assignedMachines: assignedMachines.length > 0 ? assignedMachines : ['Heavy Track Gang #14'],
              scheduledDate: dateStr,
              weekNumber,
              monthName,
            };

            generatedBlocks.push(block);
            scheduled = true;
            break;
          }
        }

        if (scheduled) break;
      }

      // If cannot be scheduled clash-free within horizon, add to unscheduled list (SAFETY INVARIANT)
      if (!scheduled) {
        cluster.forEach(t => unscheduledTasks.push(t));
      }
    });
  });

  // 6. Post-Greedy 2-Opt Local Search Improvement Loop
  // Evaluates potential block slot swaps on identical sections to minimize freight penalty & maximize downtime savings
  if (generatedBlocks.length > 3) {
    for (let i = 0; i < generatedBlocks.length - 1; i++) {
      const b1 = generatedBlocks[i];
      const b2 = generatedBlocks[i + 1];

      if (b1.sectionId === b2.sectionId && b1.scheduledDate === b2.scheduledDate) {
        // Evaluate swapping slot times
        const check1 = checkBlockTrainConflict(b1.sectionId, b2.startTime, b2.endTime, trainMovements);
        const check2 = checkBlockTrainConflict(b2.sectionId, b1.startTime, b1.endTime, trainMovements);

        if (!check1.isHardPassengerViolation && !check2.isHardPassengerViolation) {
          const currentPenalty = b1.trainImpactMinutes + b2.trainImpactMinutes;
          const swappedPenalty = check1.delayRiskMinutes + check2.delayRiskMinutes;

          if (swappedPenalty < currentPenalty) {
            // Swap times and associated machine allocations
            const tempStart = b1.startTime;
            const tempEnd = b1.endTime;
            const tempMachines = b1.assignedMachines;

            b1.startTime = b2.startTime;
            b1.endTime = b2.endTime;
            b1.trainImpactMinutes = check1.delayRiskMinutes;
            b1.assignedMachines = b2.assignedMachines;

            b2.startTime = tempStart;
            b2.endTime = tempEnd;
            b2.trainImpactMinutes = check2.delayRiskMinutes;
            b2.assignedMachines = tempMachines;
          }
        }
      }
    }
  }


  // 7. Compute exact, auditable metrics with zero arbitrary multipliers
  const metrics = computeOptimizationMetrics(
    filteredTasks,
    generatedBlocks,
    corridorSections,
    horizonDays,
    scopeLevel
  );

  metrics.unscheduledTasksCount = unscheduledTasks.length;

  // 8. Generate dynamic AI recommendations
  const recommendations = generateAIRecommendations(filteredTasks, generatedBlocks, metrics);
  if (unscheduledTasks.length > 0) {
    recommendations.unshift(
      `⚠️ Safety Guard Active: ${unscheduledTasks.length} task(s) could not be fitted into clash-free windows without delaying passenger express trains. Recommend expanding weekend possessions.`
    );
  }

  return {
    blocks: generatedBlocks,
    metrics,
    recommendations,
    unscheduledTasks,
  };
}
