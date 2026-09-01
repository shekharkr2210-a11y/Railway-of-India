import { describe, it, expect } from 'vitest';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { checkBlockTrainConflict, timeStringToMinutes } from '@/app/lib/timetableEngine';

import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';

describe('optimizer', () => {
  it('PROPERTY TEST: generates blocks that NEVER violate hard passenger constraints', () => {
    const horizons: Array<'DAILY' | 'WEEKLY' | 'MONTHLY'> = ['DAILY', 'WEEKLY', 'MONTHLY'];

    for (const horizon of horizons) {
      const result = generateOptimizedBlocks(
        INITIAL_MAINTENANCE_TASKS,
        horizon,
        'NATIONAL',
        'ALL',
        'ALL',
        INITIAL_CORRIDOR_SECTIONS,
        INITIAL_TRAIN_MOVEMENTS
      );

      expect(result.blocks.length).toBeGreaterThan(0);

      // Verify each generated block against the safety constraint
      for (const block of result.blocks) {
        const conflict = checkBlockTrainConflict(
          block.sectionId,
          block.startTime,
          block.endTime,
          INITIAL_TRAIN_MOVEMENTS
        );

        // HARD SAFETY INVARIANT: Must NEVER have a hard passenger express violation
        expect(conflict.isHardPassengerViolation).toBe(false);
      }
    }
  });

  it('synthesizes multi-department shadow blocks with positive downtime savings', () => {
    const result = generateOptimizedBlocks(
      INITIAL_MAINTENANCE_TASKS,
      'WEEKLY',
      'NATIONAL',
      'ALL',
      'ALL',
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS
    );

    const shadowBlocks = result.blocks.filter(b => b.isShadowBlock);
    expect(shadowBlocks.length).toBeGreaterThan(0);

    for (const sb of shadowBlocks) {
      expect(sb.taskIds.length).toBeGreaterThan(1);
      expect(sb.downtimeSavedHours).toBeGreaterThan(0);
      expect(sb.participatingDepartments.length).toBeGreaterThanOrEqual(1);
    }

    expect(result.metrics.downtimeHoursSaved).toBeGreaterThan(0);
    expect(result.metrics.shadowBlockEfficiency).toBeGreaterThan(0);
  });

  it('allocates valid scheduled dates across weekly (7-day) and monthly (30-day) horizons', () => {
    const weeklyResult = generateOptimizedBlocks(
      INITIAL_MAINTENANCE_TASKS,
      'WEEKLY',
      'NATIONAL',
      'ALL',
      'ALL',
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS
    );

    for (const block of weeklyResult.blocks) {
      expect(block.scheduledDate).toBeDefined();
      expect(block.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(block.weekNumber).toBeDefined();
    }

    const monthlyResult = generateOptimizedBlocks(
      INITIAL_MAINTENANCE_TASKS,
      'MONTHLY',
      'NATIONAL',
      'ALL',
      'ALL',
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS
    );

    for (const block of monthlyResult.blocks) {
      expect(block.scheduledDate).toBeDefined();
      expect(block.monthName).toBeDefined();
    }
  });

  it('prevents machinery double-booking on identical dates and overlapping times', () => {
    const result = generateOptimizedBlocks(
      INITIAL_MAINTENANCE_TASKS,
      'WEEKLY',
      'NATIONAL',
      'ALL',
      'ALL',
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS
    );

    const machineBookings = new Map<string, Array<{ start: number; end: number }>>();

    for (const block of result.blocks) {
      if (!block.assignedMachines) continue;
      for (const machine of block.assignedMachines) {
        if (machine.startsWith('Heavy Track Gang')) continue;
        const key = `${block.scheduledDate}_${machine}`;
        const existing = machineBookings.get(key) || [];

        // Verify no overlap with previously booked times on the same date
        const blockStart = timeStringToMinutes(block.startTime);
        const blockEnd = timeStringToMinutes(block.endTime);

        for (const prev of existing) {
          const overlaps = !(blockEnd <= prev.start || blockStart >= prev.end);
          expect(overlaps).toBe(false);
        }

        existing.push({ start: blockStart, end: blockEnd });
        machineBookings.set(key, existing);
      }
    }
  });

});
