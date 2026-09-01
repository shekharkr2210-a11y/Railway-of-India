import { describe, it, expect } from 'vitest';
import { recoverFromDisruption, SAMPLE_DISRUPTIONS } from '../../app/lib/disruptionEngine';
import { BlockWindow, TrainMovement } from '../../app/lib/types';

describe('Real-Time Disruption Recovery Engine', () => {
  const sampleBlocks: BlockWindow[] = [
    {
      id: 'BLK-MTJ-101',
      zoneCode: 'NCR',
      divisionCode: 'PRYJ',
      sectionId: 'SEC-03',
      sectionName: 'MTJ-AGC',
      startTime: '01:00',
      endTime: '04:00',
      durationHours: 3.0,
      isShadowBlock: true,
      participatingDepartments: ['ENG'],
      taskIds: ['T1'],
      powerBlockRequired: false,
      bdmsStatus: 'PROPOSED',
      downtimeSavedHours: 1.0,
      trainImpactMinutes: 0,
      horizon: 'WEEKLY',
      crossZonalImpact: false,
      scheduledDate: '2026-09-01',
    },
    {
      id: 'BLK-NDLS-102',
      zoneCode: 'NR',
      divisionCode: 'DLI',
      sectionId: 'SEC-01',
      sectionName: 'NDLS-FZB',
      startTime: '02:00',
      endTime: '05:00',
      durationHours: 3.0,
      isShadowBlock: false,
      participatingDepartments: ['TRD'],
      taskIds: ['T2'],
      powerBlockRequired: true,
      bdmsStatus: 'PROPOSED',
      downtimeSavedHours: 0,
      trainImpactMinutes: 0,
      horizon: 'WEEKLY',
      crossZonalImpact: false,
      scheduledDate: '2026-09-01',
    },
  ];

  const sampleTrains: TrainMovement[] = [
    {
      id: 'TRN-1',
      trainNumber: '12002',
      trainName: 'Bhopal Shatabdi',
      type: 'PASSENGER_EXPRESS',
      sectionId: 'SEC-03',
      originZone: 'NR',
      destinationZone: 'WCR',
      entryTime: '06:00',
      exitTime: '06:40',
      priority: 1,
    },
  ];

  it('shifts affected blocks by incident duration on the disrupted section while preserving unaffected sections', () => {
    const disruption = SAMPLE_DISRUPTIONS[0]; // SEC-03 rail fracture (120 mins)
    const result = recoverFromDisruption(disruption, sampleBlocks, sampleTrains);

    expect(result.affectedBlocksCount).toBe(1);
    expect(result.rescheduledBlocks.length).toBe(2);

    const rescheduledSec3 = result.rescheduledBlocks.find(b => b.sectionId === 'SEC-03');
    // Original 01:00 + 120 mins = 03:00
    expect(rescheduledSec3?.startTime).toBe('03:00');
    expect(rescheduledSec3?.endTime).toBe('06:00');

    // SEC-01 was unaffected and preserved
    const sec1 = result.rescheduledBlocks.find(b => b.sectionId === 'SEC-01');
    expect(sec1?.startTime).toBe('02:00');
  });
});
