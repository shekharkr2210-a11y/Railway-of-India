import { describe, it, expect } from 'vitest';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { buildHorizonPlan } from '@/app/lib/planBuilder';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';

describe('Server Optimization & Plan Building Integration', () => {
  it('generates clash-free blocks directly from SQLite database entities', () => {
    const tasks = taskStore.getAll();
    const sections = referenceRepo.sections();
    const trainMovements = referenceRepo.trainMovements();

    expect(tasks.length).toBeGreaterThan(0);
    expect(sections.length).toBeGreaterThan(0);
    expect(trainMovements.length).toBeGreaterThan(0);

    const result = generateOptimizedBlocks(
      tasks,
      'WEEKLY',
      'NATIONAL',
      'ALL',
      'ALL',
      sections,
      trainMovements
    );

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.metrics.assetAvailabilityPercentage).toBeGreaterThan(0);
    expect(result.metrics.downtimeHoursSaved).toBeGreaterThanOrEqual(0);
  });

  it('builds structured multi-week plan documents from optimizer output', () => {
    const tasks = taskStore.getAll();
    const sections = referenceRepo.sections();
    const trainMovements = referenceRepo.trainMovements();

    const result = generateOptimizedBlocks(
      tasks,
      'MONTHLY',
      'NATIONAL',
      'ALL',
      'ALL',
      sections,
      trainMovements
    );

    const plan = buildHorizonPlan(result.blocks, 'MONTHLY');

    expect(plan.horizon).toBe('MONTHLY');
    expect(plan.totalBlocksCount).toBe(result.blocks.length);
    expect(plan.weeks.length).toBeGreaterThan(0);
    expect(plan.planId.startsWith('JBC-PLAN-MONTHLY')).toBe(true);
  });
});
