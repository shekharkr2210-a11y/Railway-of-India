/**
 * Indian Railways Real-Time Disruption Management & Dynamic Re-Planning Engine.
 * Handles sudden emergency incidents (rail fractures, OHE breakdown, incoming train delays)
 * and dynamically shifts, reschedules, or preserves downstream block possessions.
 */

import { BlockWindow, DisruptionEvent, MaintenanceTask, TrainMovement } from './types';
import { timeStringToMinutes, minutesToTimeString, checkBlockTrainConflict } from './timetableEngine';

export const SAMPLE_DISRUPTIONS: DisruptionEvent[] = [
  {
    id: 'DISRUPT-01',
    type: 'RAIL_FRACTURE',
    sectionId: 'SEC-03',
    track: 'UP_MAIN',
    reportedAtKm: 155.4,
    severity: 'CRITICAL',
    estimatedResolutionMinutes: 120,
    delayMinutesIncurred: 45,
  },
  {
    id: 'DISRUPT-02',
    type: 'OHE_BREAKDOWN',
    sectionId: 'SEC-01',
    track: 'DN_MAIN',
    reportedAtKm: 19.2,
    severity: 'CRITICAL',
    estimatedResolutionMinutes: 90,
    delayMinutesIncurred: 30,
  },
  {
    id: 'DISRUPT-03',
    type: 'TRAIN_DELAY',
    sectionId: 'SEC-02',
    track: 'UP_MAIN',
    reportedAtKm: 80.0,
    severity: 'HIGH',
    estimatedResolutionMinutes: 60,
    delayMinutesIncurred: 50,
  },
];

export interface DisruptionRecoveryResult {
  disruption: DisruptionEvent;
  affectedBlocksCount: number;
  rescheduledBlocks: BlockWindow[];
  cancelledBlocksCount: number;
  recoveryActions: string[];
  totalRecoveryTimeMinutes: number;
}

/**
 * Executes 1-Click Dynamic Disruption Recovery on scheduled block windows.
 */
export function recoverFromDisruption(
  disruption: DisruptionEvent,
  currentBlocks: BlockWindow[],
  trains: TrainMovement[]
): DisruptionRecoveryResult {
  const recoveryActions: string[] = [];
  const rescheduledBlocks: BlockWindow[] = [];
  let cancelledCount = 0;
  let affectedCount = 0;

  recoveryActions.push(
    `🚨 Emergency Alert: ${disruption.type.replace('_', ' ')} reported on section ${disruption.sectionId} (${disruption.track}) at Km ${disruption.reportedAtKm}.`
  );

  for (const block of currentBlocks) {
    // If block is on the exact disrupted section
    if (block.sectionId === disruption.sectionId) {
      affectedCount++;
      const origStartM = timeStringToMinutes(block.startTime);
      const origEndM = timeStringToMinutes(block.endTime);
      const durationM = (origEndM > origStartM ? origEndM - origStartM : (origEndM + 1440) - origStartM);

      // Shift block possession start time by disruption resolution window
      const shiftedStartM = origStartM + disruption.estimatedResolutionMinutes;
      const shiftedEndM = shiftedStartM + durationM;

      const newStartStr = minutesToTimeString(shiftedStartM);
      const newEndStr = minutesToTimeString(shiftedEndM);

      // Validate against timetable with shifted window
      const conflictCheck = checkBlockTrainConflict(block.sectionId, newStartStr, newEndStr, trains);

      if (!conflictCheck.isHardPassengerViolation) {
        rescheduledBlocks.push({
          ...block,
          startTime: newStartStr,
          endTime: newEndStr,
          trainImpactMinutes: conflictCheck.delayRiskMinutes,
        });
        recoveryActions.push(
          `⏱️ Possession ${block.id} dynamically shifted from ${block.startTime} to ${newStartStr} post-clearance.`
        );
      } else {
        cancelledCount++;
        recoveryActions.push(
          `⚠️ Possession ${block.id} deferred to next available maintenance window to avoid delaying passenger express trains.`
        );
      }
    } else {
      // Unaffected block preserved intact
      rescheduledBlocks.push({ ...block });
    }
  }

  return {
    disruption,
    affectedBlocksCount: affectedCount,
    rescheduledBlocks,
    cancelledBlocksCount: cancelledCount,
    recoveryActions,
    totalRecoveryTimeMinutes: disruption.estimatedResolutionMinutes + disruption.delayMinutesIncurred,
  };
}
