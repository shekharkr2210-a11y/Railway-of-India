import { TrainMovement } from './types';
import { getFreightImpactForWindow } from './forecastEngine';

export interface HeadwayGapWindow {
  sectionId: string;
  startMinutes: number; // 0 - 1440
  endMinutes: number; // 0 - 1440 (or up to 1680 for overnight blocks spanning midnight)
  durationHours: number;
  startTimeStr: string;
  endTimeStr: string;
  isNightWindow: boolean;
  isOvernightWindow?: boolean;
  adjacentTrainBefore?: string;
  adjacentTrainAfter?: string;
  freightImpactScore: number; // 0 = clear, >0 = freight regulated
  date?: string;
}

/**
 * Converts "HH:mm" time string to minutes from midnight (0 - 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/**
 * Converts minutes from midnight to "HH:mm" format. Supports minutes >= 1440 for next-day times.
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60).toString().padStart(2, '0');
  const mm = (normalized % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * High-Precision Headway Interval Sweep-Line Solver.
 * Scans train timetables and identifies clash-free maintenance block windows.
 * Hard constraint: High-speed passenger trains (Vande Bharat, Rajdhani, Shatabdi) must NEVER be delayed.
 * Soft constraint: Freight trains may be regulated if required (adds minimal penalty score).
 */
export function findAvailableHeadwayWindows(
  sectionId: string,
  trains: TrainMovement[],
  minDurationHours: number = 1.5,
  safetyClearanceMinutes: number = 20,
  targetDate?: string
): HeadwayGapWindow[] {
  // Filter trains traveling on this section
  const sectionTrains = trains
    .filter(t => t.sectionId === sectionId || sectionId.includes(t.sectionId))
    .sort((a, b) => timeStringToMinutes(a.entryTime) - timeStringToMinutes(b.entryTime));

  const minGapMinutes = minDurationHours * 60 + (safetyClearanceMinutes * 2);
  const gaps: HeadwayGapWindow[] = [];

  // If no trains recorded in section, open standard maintenance slots
  if (sectionTrains.length === 0) {
    const nightFreight = getFreightImpactForWindow(sectionId, 60, 300, targetDate, trains);
    const dayFreight = getFreightImpactForWindow(sectionId, 690, 870, targetDate, trains);

    gaps.push({
      sectionId,
      startMinutes: 60, // 01:00
      endMinutes: 300, // 05:00
      durationHours: 4.0,
      startTimeStr: '01:00',
      endTimeStr: '05:00',
      isNightWindow: true,
      freightImpactScore: nightFreight,
      date: targetDate,
    });
    gaps.push({
      sectionId,
      startMinutes: 690, // 11:30
      endMinutes: 870, // 14:30
      durationHours: 3.0,
      startTimeStr: '11:30',
      endTimeStr: '14:30',
      isNightWindow: false,
      freightImpactScore: dayFreight,
      date: targetDate,
    });
    return gaps;
  }

  // 1. Check window before first train of the day
  const firstTrain = sectionTrains[0];
  const firstTrainEntry = timeStringToMinutes(firstTrain.entryTime);
  if (firstTrainEntry >= minGapMinutes) {
    const startM = 60; // 01:00
    const endM = firstTrainEntry - safetyClearanceMinutes;
    const durH = (endM - startM) / 60;
    if (durH >= minDurationHours) {
      const freightScore = getFreightImpactForWindow(sectionId, startM, endM, targetDate, trains);
      gaps.push({
        sectionId,
        startMinutes: startM,
        endMinutes: endM,
        durationHours: parseFloat(durH.toFixed(1)),
        startTimeStr: minutesToTimeString(startM),
        endTimeStr: minutesToTimeString(endM),
        isNightWindow: startM < 360,
        adjacentTrainAfter: `${firstTrain.trainNumber} ${firstTrain.trainName}`,
        freightImpactScore: freightScore,
        date: targetDate,
      });
    }
  }

  // 2. Check gaps between successive trains
  for (let i = 0; i < sectionTrains.length - 1; i++) {
    const current = sectionTrains[i];
    const next = sectionTrains[i + 1];

    const currentExit = timeStringToMinutes(current.exitTime);
    const nextEntry = timeStringToMinutes(next.entryTime);

    const availableDurationMinutes = nextEntry - currentExit - (safetyClearanceMinutes * 2);

    if (availableDurationMinutes >= minDurationHours * 60) {
      const startM = currentExit + safetyClearanceMinutes;
      const endM = nextEntry - safetyClearanceMinutes;
      const durH = (endM - startM) / 60;

      const isNight = (startM >= 0 && startM < 360) || startM >= 1320;
      const freightScore = getFreightImpactForWindow(sectionId, startM, endM, targetDate, trains);

      gaps.push({
        sectionId,
        startMinutes: startM,
        endMinutes: endM,
        durationHours: parseFloat(durH.toFixed(1)),
        startTimeStr: minutesToTimeString(startM),
        endTimeStr: minutesToTimeString(endM),
        isNightWindow: isNight,
        adjacentTrainBefore: `${current.trainNumber} ${current.trainName}`,
        adjacentTrainAfter: `${next.trainNumber} ${next.trainName}`,
        freightImpactScore: freightScore,
        date: targetDate,
      });
    }
  }

  // 3. Check window after last train of the day (includes overnight past-midnight window)
  const lastTrain = sectionTrains[sectionTrains.length - 1];
  const lastTrainExit = timeStringToMinutes(lastTrain.exitTime);
  
  if (1440 - lastTrainExit >= minGapMinutes) {
    const startM = lastTrainExit + safetyClearanceMinutes;
    const endM = Math.min(1440, startM + 240); // Up to 4.0h block window within same day
    const durH = (endM - startM) / 60;
    if (durH >= minDurationHours) {
      const freightScore = getFreightImpactForWindow(sectionId, startM, endM, targetDate, trains);
      gaps.push({
        sectionId,
        startMinutes: startM,
        endMinutes: endM,
        durationHours: parseFloat(durH.toFixed(1)),
        startTimeStr: minutesToTimeString(startM),
        endTimeStr: minutesToTimeString(endM),
        isNightWindow: startM >= 1320 || startM < 360,
        adjacentTrainBefore: `${lastTrain.trainNumber} ${lastTrain.trainName}`,
        freightImpactScore: freightScore,
        date: targetDate,
      });
    }
  } else if (lastTrainExit >= 1320 && firstTrainEntry >= 360) {
    // Overnight past-midnight window spanning 23:00 -> 04:00 (crosses 1440m barrier)
    const overnightStartM = Math.max(1380, lastTrainExit + safetyClearanceMinutes); // ~23:00
    const overnightEndM = 1440 + Math.min(240, firstTrainEntry - safetyClearanceMinutes); // ~04:00
    const overnightDurH = (overnightEndM - overnightStartM) / 60;

    if (overnightDurH >= minDurationHours) {
      const freightScore = getFreightImpactForWindow(sectionId, 0, 240, targetDate, trains);
      gaps.push({
        sectionId,
        startMinutes: overnightStartM % 1440,
        endMinutes: overnightEndM % 1440,
        durationHours: parseFloat(overnightDurH.toFixed(1)),
        startTimeStr: minutesToTimeString(overnightStartM),
        endTimeStr: minutesToTimeString(overnightEndM),
        isNightWindow: true,
        isOvernightWindow: true,
        adjacentTrainBefore: `${lastTrain.trainNumber} ${lastTrain.trainName}`,
        adjacentTrainAfter: `${firstTrain.trainNumber} ${firstTrain.trainName}`,
        freightImpactScore: freightScore,
        date: targetDate,
      });
    }
  }

  return gaps;
}

/**
 * Sweeps timetable headway gaps for a specific date and section.
 */
export function findWindowsForDate(
  sectionId: string,
  targetDate: string,
  trainMovements: TrainMovement[],
  minDurationHours: number = 1.5,
  safetyClearanceMinutes: number = 20
): HeadwayGapWindow[] {
  return findAvailableHeadwayWindows(sectionId, trainMovements, minDurationHours, safetyClearanceMinutes, targetDate);
}

/**
 * Validates whether a proposed maintenance block window conflicts with any passenger or freight trains.
 */
export function checkBlockTrainConflict(
  sectionId: string,
  startTimeStr: string,
  endTimeStr: string,
  trains: TrainMovement[]
): {
  hasConflict: boolean;
  conflictingTrains: TrainMovement[];
  delayRiskMinutes: number;
  isHardPassengerViolation: boolean;
} {
  const blockStart = timeStringToMinutes(startTimeStr);
  const blockEnd = timeStringToMinutes(endTimeStr);

  const sectionTrains = trains.filter(t => t.sectionId === sectionId || sectionId.includes(t.sectionId));
  const conflictingTrains: TrainMovement[] = [];
  let isHardPassengerViolation = false;
  let delayRiskMinutes = 0;

  for (const train of sectionTrains) {
    const trainEntry = timeStringToMinutes(train.entryTime);
    const trainExit = timeStringToMinutes(train.exitTime);

    // Overlap condition handling both same-day and overnight windows
    let overlap = 0;
    if (blockEnd > blockStart) {
      overlap = Math.max(0, Math.min(blockEnd, trainExit) - Math.max(blockStart, trainEntry));
    } else {
      // Overnight block wrapping midnight (e.g. 23:00 to 03:00)
      const lateOverlap = Math.max(0, Math.min(1440, trainExit) - Math.max(blockStart, trainEntry));
      const earlyOverlap = Math.max(0, Math.min(blockEnd, trainExit) - Math.max(0, trainEntry));
      overlap = lateOverlap + earlyOverlap;
    }

    if (overlap > 0) {
      conflictingTrains.push(train);
      delayRiskMinutes += overlap;
      if (train.type === 'PASSENGER_EXPRESS') {
        isHardPassengerViolation = true;
      }
    }
  }

  return {
    hasConflict: conflictingTrains.length > 0,
    conflictingTrains,
    delayRiskMinutes,
    isHardPassengerViolation,
  };
}
