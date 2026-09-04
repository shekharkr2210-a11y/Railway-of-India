import { describe, it, expect } from 'vitest';
import { solveParetoOptimalBlocks, dominates, ParetoCandidateSchedule } from '../../app/lib/solver/multiObjectiveSolver';
import { INITIAL_CORRIDOR_SECTIONS, INITIAL_MAINTENANCE_TASKS, INITIAL_TRAIN_MOVEMENTS } from '../../app/lib/mockData';

describe('Pareto Multi-Objective Optimization Solver', () => {
  it('correctly calculates Pareto dominance between two candidate schedules', () => {
    const candidateA: ParetoCandidateSchedule = {
      id: 'A',
      blocks: [],
      unscheduledTasks: [],
      objectives: {
        totalDowntimeSavedHours: 12.0,
        freightPenaltyScore: 5.0,
        tciSatisfactionScore: 850,
        machineUtilizationScore: 60,
      },
      paretoRank: 1,
      crowdingDistance: 0,
      isDominated: false,
    };

    const candidateB: ParetoCandidateSchedule = {
      id: 'B',
      blocks: [],
      unscheduledTasks: [],
      objectives: {
        totalDowntimeSavedHours: 8.0,
        freightPenaltyScore: 10.0,
        tciSatisfactionScore: 700,
        machineUtilizationScore: 40,
      },
      paretoRank: 1,
      crowdingDistance: 0,
      isDominated: false,
    };

    expect(dominates(candidateA, candidateB)).toBe(true);
    expect(dominates(candidateB, candidateA)).toBe(false);
  });

  it('solves non-dominated Pareto candidate schedule across initial tasks', () => {
    const result = solveParetoOptimalBlocks(
      INITIAL_MAINTENANCE_TASKS,
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS,
      7
    );

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.objectives.totalDowntimeSavedHours).toBeGreaterThan(0);
    expect(result.objectives.tciSatisfactionScore).toBeGreaterThan(0);
    expect(result.blocks.every(b => b.solverType === 'PARETO_MULTI_OBJECTIVE')).toBe(true);
  });
});
