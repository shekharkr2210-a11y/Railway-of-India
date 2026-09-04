import { BlockWindow, CorridorSection, MaintenanceTask, TrainMovement } from '../types';
import { calculateMLCriticality } from '../mlEngine';
import { findWindowsForDate, checkBlockTrainConflict, minutesToTimeString } from '../timetableEngine';
import { DependencyGraph } from '../dependencyGraph';

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
  crowdingDistance: number;
  isDominated: boolean;
}

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

function nonDominatedSort(population: ParetoCandidateSchedule[]): ParetoCandidateSchedule[][] {
  const fronts: ParetoCandidateSchedule[][] = [[]];
  const dominationCount: Map<string, number> = new Map();
  const dominatedSet: Map<string, ParetoCandidateSchedule[]> = new Map();

  population.forEach(p => {
    dominationCount.set(p.id, 0);
    dominatedSet.set(p.id, []);
  });

  for (const p of population) {
    for (const q of population) {
      if (p.id === q.id) continue;
      if (dominates(p, q)) {
        dominatedSet.get(p.id)!.push(q);
      } else if (dominates(q, p)) {
        dominationCount.set(p.id, dominationCount.get(p.id)! + 1);
      }
    }
    if (dominationCount.get(p.id) === 0) {
      p.paretoRank = 1;
      p.isDominated = false;
      fronts[0].push(p);
    }
  }

  let i = 0;
  while (i < fronts.length && fronts[i].length > 0) {
    const nextFront: ParetoCandidateSchedule[] = [];
    for (const p of fronts[i]) {
      for (const q of dominatedSet.get(p.id)!) {
        dominationCount.set(q.id, dominationCount.get(q.id)! - 1);
        if (dominationCount.get(q.id) === 0) {
          q.paretoRank = i + 2;
          nextFront.push(q);
        }
      }
    }
    i++;
    if (nextFront.length > 0) fronts.push(nextFront);
  }

  return fronts.filter(f => f.length > 0);
}

function calculateCrowdingDistance(front: ParetoCandidateSchedule[]) {
  const l = front.length;
  if (l === 0) return;
  front.forEach(p => p.crowdingDistance = 0);
  
  const objectives = ['totalDowntimeSavedHours', 'freightPenaltyScore', 'tciSatisfactionScore', 'machineUtilizationScore'] as const;
  
  for (const obj of objectives) {
    front.sort((a, b) => a.objectives[obj] - b.objectives[obj]);
    front[0].crowdingDistance = Infinity;
    front[l - 1].crowdingDistance = Infinity;
    
    const min = front[0].objectives[obj];
    const max = front[l - 1].objectives[obj];
    if (max === min) continue;
    
    for (let i = 1; i < l - 1; i++) {
      front[i].crowdingDistance += (front[i + 1].objectives[obj] - front[i - 1].objectives[obj]) / (max - min);
    }
  }
}

function crossover(p1: ParetoCandidateSchedule, p2: ParetoCandidateSchedule): ParetoCandidateSchedule {
  // Uniform crossover: randomly pick blocks from p1 or p2
  const newBlocks = [];
  const p1Blocks = p1.blocks;
  const p2Blocks = p2.blocks;
  const maxBlocks = Math.max(p1Blocks.length, p2Blocks.length);
  
  for (let i = 0; i < maxBlocks; i++) {
    if (i < p1Blocks.length && i < p2Blocks.length) {
      newBlocks.push(Math.random() > 0.5 ? p1Blocks[i] : p2Blocks[i]);
    } else if (i < p1Blocks.length) {
      newBlocks.push(p1Blocks[i]);
    } else {
      newBlocks.push(p2Blocks[i]);
    }
  }
  
  // Need to merge unscheduled tasks, simplistic approach for hackathon
  const newUnscheduled = Array.from(new Set([...p1.unscheduledTasks, ...p2.unscheduledTasks]));
  
  return {
    id: `CHILD-${Math.random()}`,
    blocks: newBlocks,
    unscheduledTasks: newUnscheduled,
    objectives: { ...p1.objectives }, // to be recalculated
    paretoRank: 0,
    crowdingDistance: 0,
    isDominated: false
  };
}

function mutate(p: ParetoCandidateSchedule, allTasks: MaintenanceTask[], trains: TrainMovement[], sections: CorridorSection[], horizonDays: number, baseStartDate: Date): ParetoCandidateSchedule {
  // 10% mutation: reassign a random block to a different time window
  if (Math.random() < 0.1 && p.blocks.length > 0) {
    const blockIdx = Math.floor(Math.random() * p.blocks.length);
    const block = p.blocks[blockIdx];
    
    // Find new window
    const dateStr = new Date(baseStartDate.getTime() + Math.floor(Math.random() * horizonDays) * 86400000).toISOString().split('T')[0];
    const windows = findWindowsForDate(block.sectionId, dateStr, trains);
    if (windows.length > 0) {
      const win = windows[Math.floor(Math.random() * windows.length)];
      block.scheduledDate = dateStr;
      block.startTime = minutesToTimeString(win.startMinutes);
      block.endTime = minutesToTimeString(win.startMinutes + Math.round(block.durationHours * 60));
      
      const check = checkBlockTrainConflict(block.sectionId, block.startTime, block.endTime, trains);
      if (!check.isHardPassengerViolation) {
        block.trainImpactMinutes = check.delayRiskMinutes;
      }
    }
  }
  return p;
}

export function solveParetoOptimalBlocks(
  tasks: MaintenanceTask[],
  sections: CorridorSection[],
  trains: TrainMovement[],
  horizonDays: number = 7,
  startDateStr?: string
): ParetoCandidateSchedule {
  const baseStartDate = startDateStr ? new Date(startDateStr) : new Date();
  const POPULATION_SIZE = 50; // Hackathon reasonable speed
  const GENERATIONS = 30;

  // Validate dependencies
  const graph = new DependencyGraph(tasks);
  if (graph.hasCycles()) {
    throw new Error("Task dependencies have cycles");
  }
  const orderedTasks = graph.getTopologicalSort().map(id => tasks.find(t => t.id === id)!).filter(Boolean);

  let population: ParetoCandidateSchedule[] = [];

  // Generate initial population using variations of greedy
  for (let i = 0; i < POPULATION_SIZE; i++) {
    population.push(generateRandomSchedule(orderedTasks, sections, trains, horizonDays, baseStartDate, i));
  }

  for (let gen = 0; gen < GENERATIONS; gen++) {
    // Selection, Crossover, Mutation
    const offspring: ParetoCandidateSchedule[] = [];
    while (offspring.length < POPULATION_SIZE) {
      // Tournament selection
      const t1 = population[Math.floor(Math.random() * population.length)];
      const t2 = population[Math.floor(Math.random() * population.length)];
      const p1 = (t1.paretoRank < t2.paretoRank || (t1.paretoRank === t2.paretoRank && t1.crowdingDistance > t2.crowdingDistance)) ? t1 : t2;
      
      const t3 = population[Math.floor(Math.random() * population.length)];
      const t4 = population[Math.floor(Math.random() * population.length)];
      const p2 = (t3.paretoRank < t4.paretoRank || (t3.paretoRank === t4.paretoRank && t3.crowdingDistance > t4.crowdingDistance)) ? t3 : t4;
      
      let child = crossover(p1, p2);
      child = mutate(child, orderedTasks, trains, sections, horizonDays, baseStartDate);
      recalculateObjectives(child, orderedTasks);
      offspring.push(child);
    }

    const combined = [...population, ...offspring];
    const fronts = nonDominatedSort(combined);
    
    let nextPop: ParetoCandidateSchedule[] = [];
    for (const front of fronts) {
      calculateCrowdingDistance(front);
      if (nextPop.length + front.length <= POPULATION_SIZE) {
        nextPop.push(...front);
      } else {
        front.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
        nextPop.push(...front.slice(0, POPULATION_SIZE - nextPop.length));
        break;
      }
    }
    population = nextPop;
  }

  const bestFront = nonDominatedSort(population)[0];
  
  // Weighted scalarization to pick the best from Pareto front
  // Minimize freight, maximize others
  const bestCandidate = bestFront.sort((a, b) => {
    const scoreA = (a.objectives.totalDowntimeSavedHours * 10) + a.objectives.tciSatisfactionScore - (a.objectives.freightPenaltyScore * 5) + (a.objectives.machineUtilizationScore * 2);
    const scoreB = (b.objectives.totalDowntimeSavedHours * 10) + b.objectives.tciSatisfactionScore - (b.objectives.freightPenaltyScore * 5) + (b.objectives.machineUtilizationScore * 2);
    return scoreB - scoreA;
  })[0];

  return bestCandidate || population[0];
}

function generateRandomSchedule(
  tasks: MaintenanceTask[],
  sections: CorridorSection[],
  trains: TrainMovement[],
  horizonDays: number,
  baseStartDate: Date,
  seed: number
): ParetoCandidateSchedule {
  // Scramble tasks slightly for variety, but roughly respect topological order
  const scoredTasks = tasks.map(t => ({
    ...t,
    criticalityScore: calculateMLCriticality(t, sections.find(s => s.id === t.sectionId)) + (Math.random() * 20 - 10)
  })).sort((a, b) => b.criticalityScore - a.criticalityScore);

  const blocks: BlockWindow[] = [];
  const unscheduledTasks: MaintenanceTask[] = [];
  let blockCounter = seed * 1000;

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

  const sectionGroups: Record<string, typeof scoredTasks> = {};
  scoredTasks.forEach(task => {
    if (!sectionGroups[task.sectionId]) sectionGroups[task.sectionId] = [];
    sectionGroups[task.sectionId].push(task);
  });

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
          if (Math.abs(task.startKm - other.startKm) <= (4 + Math.random() * 8)) { // Random radius 4-12km
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
      const dayOrder = Array.from({length: horizonDays}, (_, i) => i).sort(() => Math.random() - 0.5);

      for (const day of dayOrder) {
        const d = new Date(baseStartDate);
        d.setDate(baseStartDate.getDate() + day);
        const dateStr = d.toISOString().split('T')[0];

        const windows = findWindowsForDate(sectionId, dateStr, trains);
        const winOrder = windows.sort(() => Math.random() - 0.5);
        for (const win of winOrder) {
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
              id: `BLK-NSGA-${blockCounter++}`,
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
            totalFreightPenalty += check.delayRiskMinutes;
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

  return {
    id: `CANDIDATE-${Math.random()}`,
    blocks,
    unscheduledTasks,
    objectives: {
      totalDowntimeSavedHours: parseFloat(totalDowntimeSaved.toFixed(1)),
      freightPenaltyScore: parseFloat(totalFreightPenalty.toFixed(1)),
      tciSatisfactionScore: Math.round(totalTciSatisfied),
      machineUtilizationScore: blocks.filter(b => b.assignedMachines && b.assignedMachines.length > 0).length * 15,
    },
    paretoRank: 0,
    crowdingDistance: 0,
    isDominated: false,
  };
}

function recalculateObjectives(p: ParetoCandidateSchedule, allTasks: MaintenanceTask[]) {
  p.objectives.totalDowntimeSavedHours = p.blocks.reduce((a, b) => a + b.downtimeSavedHours, 0);
  p.objectives.freightPenaltyScore = p.blocks.reduce((a, b) => a + b.trainImpactMinutes, 0);
  
  let tci = 0;
  p.blocks.forEach(b => {
    b.taskIds.forEach(id => {
      const t = allTasks.find(x => x.id === id);
      if (t) tci += (t.criticalityScore || 0);
    });
  });
  p.objectives.tciSatisfactionScore = Math.round(tci);
  p.objectives.machineUtilizationScore = p.blocks.filter(b => b.assignedMachines && b.assignedMachines.length > 0).length * 15;
}
