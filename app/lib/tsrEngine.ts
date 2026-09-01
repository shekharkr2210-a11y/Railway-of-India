/**
 * Indian Railways Post-Maintenance Temporary Speed Restriction (TSR) Relaxation Engine.
 * Models speed relaxation recovery stages according to Indian Railways Permanent Way Manual (IRPWM)
 * following heavy mechanized track possessions (BCM, TRT, CTR, CSM).
 */

import { MaintenanceTask, TSRRelaxationProfile, TSRStage } from './types';

/**
 * Calculates additional train delay minutes incurred due to a Temporary Speed Restriction (TSR).
 * Formula: Delay = (Length / v_TSR - Length / v_Max) * 60 + accel/decel penalty (2.0 mins)
 */
export function calculateTSRDelayMinutes(
  lengthKm: number,
  tsrSpeedKmph: number,
  sectionalSpeedKmph: number = 130
): number {
  if (tsrSpeedKmph >= sectionalSpeedKmph) return 0;
  const normalTimeMins = (lengthKm / sectionalSpeedKmph) * 60;
  const restrictedTimeMins = (lengthKm / tsrSpeedKmph) * 60;
  const lossOfTime = (restrictedTimeMins - normalTimeMins) + 2.0; // 2 min braking/acceleration buffer
  return parseFloat(Math.max(0.5, lossOfTime).toFixed(2));
}

/**
 * Generates an official 3-stage TSR relaxation schedule for heavy track possessions.
 * Stage 1 (Day 1): 30 km/h (Immediate post-possession consolidation)
 * Stage 2 (Day 2): 75 km/h (Intermediate tamping & dynamic track stabilizer consolidation)
 * Stage 3 (Day 3+): 130 km/h (Normal sectional speed restoration)
 */
export function generateTSRRelaxationProfile(
  task: MaintenanceTask,
  startDateStr: string = new Date().toISOString().split('T')[0],
  sectionalSpeedKmph: number = 130
): TSRRelaxationProfile {
  const lengthKm = Math.max(1.0, Math.abs(task.endKm - task.startKm));
  const isHeavyTrackWork = 
    task.department === 'ENG' && (
      task.title.toLowerCase().includes('ballast') ||
      task.title.toLowerCase().includes('renewal') ||
      task.title.toLowerCase().includes('weld') ||
      task.title.toLowerCase().includes('machining') ||
      task.title.toLowerCase().includes('turnout')
    );

  const stages: TSRStage[] = [];

  if (isHeavyTrackWork) {
    stages.push({
      dayNumber: 1,
      speedLimitKmph: 30,
      sectionalSpeedKmph,
      addedDelayMinutesPerTrain: calculateTSRDelayMinutes(lengthKm, 30, sectionalSpeedKmph),
    });
    stages.push({
      dayNumber: 2,
      speedLimitKmph: 75,
      sectionalSpeedKmph,
      addedDelayMinutesPerTrain: calculateTSRDelayMinutes(lengthKm, 75, sectionalSpeedKmph),
    });
    stages.push({
      dayNumber: 3,
      speedLimitKmph: sectionalSpeedKmph,
      sectionalSpeedKmph,
      addedDelayMinutesPerTrain: 0,
    });
  } else {
    // Routine S&T or TRD inspections do not require permanent way speed restrictions
    stages.push({
      dayNumber: 1,
      speedLimitKmph: sectionalSpeedKmph,
      sectionalSpeedKmph,
      addedDelayMinutesPerTrain: 0,
    });
  }

  const startD = new Date(startDateStr);
  startD.setDate(startD.getDate() + stages.length);
  const fullRecoveryDate = startD.toISOString().split('T')[0];

  return {
    taskId: task.id,
    sectionId: task.sectionId,
    startKm: task.startKm,
    endKm: task.endKm,
    stages,
    fullRecoveryDate,
  };
}

/**
 * Computes network passenger and freight train delay minutes saved by completing maintenance
 * and lifting chronic emergency Speed Restrictions (TSRs).
 */
export function calculateTSRDelaySavings(
  tasks: MaintenanceTask[],
  dailyPassengerCount: number = 42,
  dailyFreightCount: number = 24
): {
  totalDelayMinutesSavedDaily: number;
  totalPassengerDelaySavedMinutes: number;
  totalFreightDelaySavedMinutes: number;
} {
  let totalDelayMinsDaily = 0;

  for (const task of tasks) {
    if (task.speedRestrictionImpactKmvh && task.speedRestrictionImpactKmvh > 0) {
      const lengthKm = Math.max(1.0, Math.abs(task.endKm - task.startKm));
      const imposedSpeed = Math.max(20, 130 - task.speedRestrictionImpactKmvh);
      const delayPerTrain = calculateTSRDelayMinutes(lengthKm, imposedSpeed, 130);
      const dailyTrains = dailyPassengerCount + dailyFreightCount;
      totalDelayMinsDaily += delayPerTrain * dailyTrains;
    }
  }

  const passengerShare = (dailyPassengerCount / (dailyPassengerCount + dailyFreightCount || 1));
  const passengerMins = Math.round(totalDelayMinsDaily * passengerShare);
  const freightMins = Math.round(totalDelayMinsDaily * (1 - passengerShare));

  return {
    totalDelayMinutesSavedDaily: Math.round(totalDelayMinsDaily),
    totalPassengerDelaySavedMinutes: passengerMins,
    totalFreightDelaySavedMinutes: freightMins,
  };
}
