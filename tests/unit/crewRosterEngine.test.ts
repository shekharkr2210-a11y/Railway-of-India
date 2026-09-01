import { describe, it, expect } from 'vitest';
import { checkHOERCompliance, rosterCrewsForBlocks, DepartmentGang } from '../../app/lib/crewRosterEngine';
import { BlockWindow } from '../../app/lib/types';

describe('HOER Crew Rostering & Statutory Rest Engine', () => {
  const sampleGang: DepartmentGang = {
    gangId: 'GANG-TEST-01',
    department: 'ENG',
    name: 'Mathura Track Gang',
    homeStation: 'MTJ',
    lastShiftEnd: '2026-09-01T04:00:00', // Ended at 04:00 AM (Night shift)
    totalShiftsThisWeek: 2,
  };

  it('enforces 12 hours statutory rest following a night possession', () => {
    // Attempting next shift at 10:00 AM same day (only 6 hours rest) -> Violation
    const check1 = checkHOERCompliance(sampleGang, '2026-09-01', 600, 780);
    expect(check1.isCompliant).toBe(false);
    expect(check1.requiredRestHours).toBe(12);

    // Attempting next shift at 18:00 (14 hours rest) -> Compliant
    const check2 = checkHOERCompliance(sampleGang, '2026-09-01', 1080, 1260);
    expect(check2.isCompliant).toBe(true);
  });

  it('enforces 6 maximum shifts per week limit', () => {
    const exhaustedGang: DepartmentGang = {
      ...sampleGang,
      totalShiftsThisWeek: 6,
    };

    const check = checkHOERCompliance(exhaustedGang, '2026-09-02', 480, 660);
    expect(check.isCompliant).toBe(false);
    expect(check.requiredRestHours).toBe(24);
  });

  it('rosters crews across scheduled block windows without crashing', () => {
    const sampleBlocks: BlockWindow[] = [
      {
        id: 'BLK-01',
        zoneCode: 'NCR',
        divisionCode: 'PRYJ',
        sectionId: 'SEC-03',
        sectionName: 'MTJ-AGC',
        startTime: '01:00',
        endTime: '04:00',
        durationHours: 3.0,
        isShadowBlock: true,
        participatingDepartments: ['ENG', 'TRD'],
        taskIds: ['T1', 'T2'],
        powerBlockRequired: true,
        bdmsStatus: 'PROPOSED',
        downtimeSavedHours: 1.5,
        trainImpactMinutes: 0,
        horizon: 'WEEKLY',
        crossZonalImpact: true,
        scheduledDate: '2026-09-01',
      },
    ];

    const roster = rosterCrewsForBlocks(sampleBlocks);
    expect(roster.length).toBe(2); // One for ENG, one for TRD
    expect(roster[0].department).toBe('ENG');
    expect(roster[1].department).toBe('TRD');
    expect(roster[0].isNightShift).toBe(true);
  });
});
