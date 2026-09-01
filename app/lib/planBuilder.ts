import { BlockWindow } from './types';

export interface HorizonBlockPlan {
  planId: string;
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  generatedAt: string;
  totalBlocksCount: number;
  totalScheduledHours: number;
  totalDowntimeSavedHours: number;
  weeks: Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    blocksCount: number;
    scheduledHours: number;
    blocks: BlockWindow[];
  }>;
  blocks: BlockWindow[];
}

/**
 * Builds a structured multi-week / monthly plan document from generated blocks.
 */
export function buildHorizonPlan(
  blocks: BlockWindow[],
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY'
): HorizonBlockPlan {
  const planId = `JBC-PLAN-${horizon}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const totalScheduledHours = parseFloat(blocks.reduce((sum, b) => sum + b.durationHours, 0).toFixed(1));
  const totalDowntimeSavedHours = parseFloat(blocks.reduce((sum, b) => sum + b.downtimeSavedHours, 0).toFixed(1));

  // Group blocks by week number
  const weekMap = new Map<number, BlockWindow[]>();
  blocks.forEach(b => {
    const w = b.weekNumber || 1;
    const list = weekMap.get(w) || [];
    list.push(b);
    weekMap.set(w, list);
  });

  const weeks = Array.from(weekMap.entries())
    .sort(([w1], [w2]) => w1 - w2)
    .map(([weekNumber, weekBlocks]) => {
      const sortedDates = weekBlocks.map(b => b.scheduledDate || '').filter(Boolean).sort();
      const startDate = sortedDates[0] || now.split('T')[0];
      const endDate = sortedDates[sortedDates.length - 1] || startDate;
      const scheduledHours = parseFloat(weekBlocks.reduce((sum, b) => sum + b.durationHours, 0).toFixed(1));

      return {
        weekNumber,
        startDate,
        endDate,
        blocksCount: weekBlocks.length,
        scheduledHours,
        blocks: weekBlocks,
      };
    });

  return {
    planId,
    horizon,
    generatedAt: now,
    totalBlocksCount: blocks.length,
    totalScheduledHours,
    totalDowntimeSavedHours,
    weeks,
    blocks,
  };
}

/**
 * Generates official CSV formatted content for Joint Block Circular (JBC) downloads.
 */
export function generatePlanCsv(plan: HorizonBlockPlan): string {
  const headers = [
    'Block_ID',
    'Scheduled_Date',
    'Week_Number',
    'Zone',
    'Division',
    'Corridor_Section',
    'Start_Time',
    'End_Time',
    'Duration_Hours',
    'Is_Shadow_Block',
    'Participating_Departments',
    'Tasks_Count',
    'Power_Block_Required',
    'Assigned_Machines',
    'Downtime_Saved_Hours',
    'Train_Impact_Minutes',
    'BDMS_Status',
  ];

  const rows = plan.blocks.map(b => [
    b.id,
    b.scheduledDate || '',
    b.weekNumber || 1,
    b.zoneCode,
    b.divisionCode,
    `"${b.sectionName}"`,
    b.startTime,
    b.endTime,
    b.durationHours,
    b.isShadowBlock ? 'YES' : 'NO',
    `"${b.participatingDepartments.join('+')}"`,
    b.taskIds.length,
    b.powerBlockRequired ? 'YES (25kV OHE)' : 'NO',
    `"${(b.assignedMachines || []).join('; ')}"`,
    b.downtimeSavedHours,
    b.trainImpactMinutes,
    b.bdmsStatus,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
