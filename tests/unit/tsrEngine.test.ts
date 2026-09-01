import { describe, it, expect } from 'vitest';
import { calculateTSRDelayMinutes, generateTSRRelaxationProfile, calculateTSRDelaySavings } from '../../app/lib/tsrEngine';
import { MaintenanceTask } from '../../app/lib/types';

describe('TSR Engine (Temporary Speed Restriction & Delay Model)', () => {
  it('calculates delay minutes correctly for a 30 km/h speed restriction vs 130 km/h', () => {
    const delay = calculateTSRDelayMinutes(2.0, 30, 130);
    // (2 / 30 - 2 / 130) * 60 + 2 = (0.0666 - 0.01538) * 60 + 2 = 3.07 + 2 = ~5.08 mins
    expect(delay).toBeGreaterThan(4.5);
    expect(delay).toBeLessThan(6.0);
  });

  it('returns 0 delay when TSR speed is equal to sectional speed', () => {
    const delay = calculateTSRDelayMinutes(2.0, 130, 130);
    expect(delay).toBe(0);
  });

  it('generates a 3-stage relaxation profile for heavy track renewals', () => {
    const heavyTask: MaintenanceTask = {
      id: 'TASK-HEAVY-1',
      sourceSystem: 'TMS',
      department: 'ENG',
      departmentName: 'Civil Engineering (Track)',
      zoneCode: 'NCR',
      divisionCode: 'PRYJ',
      title: 'Deep Ballast Shoulder Cleaning Machine (BCM) Track Possession',
      sectionId: 'SEC-03',
      sectionName: 'MTJ-AGC',
      startKm: 154,
      endKm: 156,
      estimatedDurationHours: 3.5,
      severity: 'HIGH',
      overdueDays: 4,
      requiresPowerBlock: false,
      speedRestrictionImpactKmvh: 40,
      criticalityScore: 82,
      status: 'PENDING',
    };

    const profile = generateTSRRelaxationProfile(heavyTask, '2026-09-01', 130);
    expect(profile.stages.length).toBe(3);
    expect(profile.stages[0].speedLimitKmph).toBe(30);
    expect(profile.stages[1].speedLimitKmph).toBe(75);
    expect(profile.stages[2].speedLimitKmph).toBe(130);
    expect(profile.stages[2].addedDelayMinutesPerTrain).toBe(0);
  });

  it('calculates network delay savings for existing tasks with speed restrictions', () => {
    const tasks: MaintenanceTask[] = [
      {
        id: 'T1',
        sourceSystem: 'TMS',
        department: 'ENG',
        departmentName: 'Track',
        zoneCode: 'NCR',
        divisionCode: 'PRYJ',
        title: 'Weld Defect',
        sectionId: 'SEC-03',
        sectionName: 'MTJ-AGC',
        startKm: 154,
        endKm: 156,
        estimatedDurationHours: 2.0,
        severity: 'CRITICAL',
        overdueDays: 5,
        requiresPowerBlock: false,
        speedRestrictionImpactKmvh: 45,
        criticalityScore: 88,
        status: 'PENDING',
      },
    ];

    const savings = calculateTSRDelaySavings(tasks, 40, 20);
    expect(savings.totalDelayMinutesSavedDaily).toBeGreaterThan(0);
    expect(savings.totalPassengerDelaySavedMinutes).toBeGreaterThan(0);
    expect(savings.totalFreightDelaySavedMinutes).toBeGreaterThan(0);
  });
});
