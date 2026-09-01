import { describe, it, expect } from 'vitest';
import { 
  findAvailableHeadwayWindows, 
  checkBlockTrainConflict, 
  timeStringToMinutes, 
  minutesToTimeString 
} from '@/app/lib/timetableEngine';
import { INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';
import { TrainMovement } from '@/app/lib/types';

describe('timetableEngine', () => {
  it('converts time strings to minutes and back correctly', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('01:30')).toBe(90);
    expect(timeStringToMinutes('12:00')).toBe(720);
    expect(timeStringToMinutes('23:59')).toBe(1439);

    expect(minutesToTimeString(0)).toBe('00:00');
    expect(minutesToTimeString(90)).toBe('01:30');
    expect(minutesToTimeString(720)).toBe('12:00');
    expect(minutesToTimeString(1439)).toBe('23:59');
  });

  it('finds headway gap windows on a section with trains', () => {
    const sectionId = 'SEC-03';
    const windows = findAvailableHeadwayWindows(sectionId, INITIAL_TRAIN_MOVEMENTS, 1.5, 20);

    expect(windows.length).toBeGreaterThan(0);
    for (const w of windows) {
      expect(w.durationHours).toBeGreaterThanOrEqual(1.5);
      expect(w.sectionId).toBe(sectionId);
      expect(w.startMinutes).toBeLessThan(w.endMinutes);
    }
  });

  it('detects conflicts with passenger express trains as hard violations', () => {
    const sectionId = 'SEC-03';
    // TRN-22436 Vande Bharat is on SEC-03 between 06:15 and 06:55
    const conflict = checkBlockTrainConflict(sectionId, '06:00', '07:30', INITIAL_TRAIN_MOVEMENTS);

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.isHardPassengerViolation).toBe(true);
    expect(conflict.conflictingTrains.some(t => t.type === 'PASSENGER_EXPRESS')).toBe(true);
    expect(conflict.delayRiskMinutes).toBeGreaterThan(0);
  });

  it('identifies clear non-conflicting windows with zero passenger delay', () => {
    const sectionId = 'SEC-03';
    // 02:00 to 04:30 is clear on SEC-03
    const conflict = checkBlockTrainConflict(sectionId, '02:00', '04:30', INITIAL_TRAIN_MOVEMENTS);

    expect(conflict.hasConflict).toBe(false);
    expect(conflict.isHardPassengerViolation).toBe(false);
    expect(conflict.delayRiskMinutes).toBe(0);
  });
});
