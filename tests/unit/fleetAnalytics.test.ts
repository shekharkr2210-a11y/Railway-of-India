import { describe, it, expect } from 'vitest';
import { calculateFleetUtilization } from '../../app/lib/fleetAnalytics';
import { BlockWindow } from '../../app/lib/types';

describe('Machine Fleet Utilization Analytics Engine', () => {
  it('calculates working hours and utilization percentage accurately', () => {
    const blocks: BlockWindow[] = [
      {
        id: 'BLK-01',
        zoneCode: 'NCR',
        divisionCode: 'PRYJ',
        sectionId: 'SEC-03',
        sectionName: 'MTJ-AGC',
        startTime: '01:00',
        endTime: '04:30',
        durationHours: 3.5,
        isShadowBlock: true,
        participatingDepartments: ['ENG', 'TRD'],
        taskIds: ['T1'],
        powerBlockRequired: true,
        bdmsStatus: 'PROPOSED',
        downtimeSavedHours: 1.5,
        trainImpactMinutes: 0,
        horizon: 'WEEKLY',
        crossZonalImpact: false,
        assignedMachines: ['BCM-1 (Ballast Cleaner)', 'TW-6 (Tower Wagon)'],
        scheduledDate: '2026-09-01',
      },
    ];

    const result = calculateFleetUtilization(blocks, 7);
    expect(result.totalFleetOperatingHours).toBe(7.0); // 3.5h for BCM-1 + 3.5h for TW-6
    expect(result.fleet.length).toBe(12);

    const bcm1 = result.fleet.find(m => m.machineCode === 'BCM-1');
    expect(bcm1?.totalWorkingHours).toBe(3.5);
    expect(bcm1?.assignedCorridors).toContain('MTJ-AGC');
    expect(bcm1?.utilizationRatePercentage).toBeGreaterThan(0);
  });
});
