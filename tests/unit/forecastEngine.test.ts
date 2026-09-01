import { describe, it, expect } from 'vitest';
import { predictFreightForSection, getFreightImpactForWindow } from '@/app/lib/forecastEngine';
import { INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';

describe('forecastEngine', () => {
  it('predicts reasonable 24h freight rake volumes per section', () => {
    const forecast = predictFreightForSection('SEC-03', '2026-09-01', 0, INITIAL_CORRIDOR_SECTIONS);

    expect(forecast.sectionId).toBe('SEC-03');
    expect(forecast.totalPredictedRakes).toBeGreaterThan(0);
    expect(forecast.totalPredictedRakes).toBeLessThan(100);
    expect(forecast.timeSlots.length).toBe(4);
    expect(forecast.dominantCargoType).toBeDefined();
  });

  it('scales predicted freight volume proportionally with surge percentages', () => {
    const baseline = predictFreightForSection('SEC-03', '2026-09-01', 0, INITIAL_CORRIDOR_SECTIONS);
    const surged = predictFreightForSection('SEC-03', '2026-09-01', 50, INITIAL_CORRIDOR_SECTIONS);

    expect(surged.totalPredictedRakes).toBeGreaterThan(baseline.totalPredictedRakes);
    expect(surged.surgeFactor).toBe(1.5);
  });

  it('calculates soft freight penalty scores for block planning windows', () => {
    const penalty = getFreightImpactForWindow('SEC-03', 0, 240, '2026-09-01', INITIAL_TRAIN_MOVEMENTS);
    expect(penalty).toBeGreaterThanOrEqual(0);
    expect(penalty).toBeLessThanOrEqual(50);
  });
});
