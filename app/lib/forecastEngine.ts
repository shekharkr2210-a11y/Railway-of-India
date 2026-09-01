/**
 * Indian Railways Control Office Application (COA) Goods-Train Forecast Engine.
 * Implements time-series freight density forecasting across corridor sections,
 * estimating freight rake movements, peak siding occupancy, and congestion factors.
 */

import { CorridorSection, TrainMovement } from './types';
import { INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from './mockData';

export interface FreightTimeSlotForecast {
  timeSlot: string; // e.g. "00:00 - 06:00"
  startMinutes: number;
  endMinutes: number;
  predictedRakes: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONGESTED';
  recommendedForMaintenance: boolean;
}

export interface SectionFreightForecast {
  sectionId: string;
  sectionName: string;
  date: string;
  totalPredictedRakes: number;
  baselineDailyFreightRakes: number;
  surgeFactor: number;
  confidenceScore: number;
  timeSlots: FreightTimeSlotForecast[];
  dominantCargoType: string;
}

/**
 * Historical baseline freight rake generation coefficients per corridor.
 */
const SECTION_FREIGHT_BASELINES: Record<string, { baseRakes: number; cargo: string }> = {
  'SEC-01': { baseRakes: 14, cargo: 'Container (CONCOR ICD)' },
  'SEC-02': { baseRakes: 18, cargo: 'Container & Automobile' },
  'SEC-03': { baseRakes: 24, cargo: 'Thermal Coal & Petroleum (POL)' },
  'SEC-04': { baseRakes: 20, cargo: 'Thermal Coal & Foodgrain' },
  'SEC-05': { baseRakes: 26, cargo: 'Thermal Coal Heavy Haul' },
  'SEC-06': { baseRakes: 22, cargo: 'Steel, Fertilizer & Coal' },
  'SEC-07': { baseRakes: 28, cargo: 'Eastern DFC Coal Shuttles' },
  'SEC-08': { baseRakes: 12, cargo: 'Fertilizer & Cement' },
  'SEC-09': { baseRakes: 10, cargo: 'Foodgrain & POL' },
  'SEC-10': { baseRakes: 15, cargo: 'Container & General Goods' },
  'SEC-11': { baseRakes: 25, cargo: 'Petroleum (IOCL/BPCL Tankers)' },
  'SEC-12': { baseRakes: 22, cargo: 'JNPT Port Container Rakes' },
};

/**
 * Predicts 24-hour freight rake density for a given corridor section on a specific date.
 */
export function predictFreightForSection(
  sectionId: string,
  targetDate: string = new Date().toISOString().split('T')[0],
  freightSurgePercentage: number = 0,
  sections: CorridorSection[] = INITIAL_CORRIDOR_SECTIONS
): SectionFreightForecast {
  const section = sections.find(s => s.id === sectionId) || sections[0];
  const baselineInfo = SECTION_FREIGHT_BASELINES[sectionId] || { baseRakes: 16, cargo: 'General Freight' };

  const dateObj = new Date(targetDate);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

  // Day-of-week seasonal multiplier (Mon-Wed peak loading, Sun slight dip)
  const dayMultipliers = [0.85, 1.15, 1.20, 1.18, 1.10, 1.05, 0.90];
  const dayMultiplier = dayMultipliers[dayOfWeek] ?? 1.0;

  const surgeMultiplier = 1 + freightSurgePercentage / 100;
  const totalPredicted = Math.round(baselineInfo.baseRakes * dayMultiplier * surgeMultiplier);

  // Time slot distribution:
  // Night (00-06): Heavy freight window (~40%)
  // Morning (06-12): Passenger priority, lower freight (~15%)
  // Afternoon (12-18): Moderate freight (~20%)
  // Evening/Night (18-24): Rising freight (~25%)
  const slotRakes = [
    Math.round(totalPredicted * 0.40),
    Math.round(totalPredicted * 0.15),
    Math.round(totalPredicted * 0.20),
    Math.round(totalPredicted * 0.25),
  ];

  const slots: FreightTimeSlotForecast[] = [
    {
      timeSlot: '00:00 - 06:00',
      startMinutes: 0,
      endMinutes: 360,
      predictedRakes: slotRakes[0],
      congestionLevel: slotRakes[0] > 9 ? 'CONGESTED' : slotRakes[0] > 6 ? 'HIGH' : 'MEDIUM',
      recommendedForMaintenance: slotRakes[0] < 8,
    },
    {
      timeSlot: '06:00 - 12:00',
      startMinutes: 360,
      endMinutes: 720,
      predictedRakes: slotRakes[1],
      congestionLevel: slotRakes[1] > 5 ? 'MEDIUM' : 'LOW',
      recommendedForMaintenance: true, // Low freight, but passenger timetable check required
    },
    {
      timeSlot: '12:00 - 18:00',
      startMinutes: 720,
      endMinutes: 1080,
      predictedRakes: slotRakes[2],
      congestionLevel: slotRakes[2] > 6 ? 'HIGH' : 'MEDIUM',
      recommendedForMaintenance: slotRakes[2] <= 5,
    },
    {
      timeSlot: '18:00 - 24:00',
      startMinutes: 1080,
      endMinutes: 1440,
      predictedRakes: slotRakes[3],
      congestionLevel: slotRakes[3] > 7 ? 'CONGESTED' : slotRakes[3] > 4 ? 'HIGH' : 'MEDIUM',
      recommendedForMaintenance: false,
    },
  ];

  return {
    sectionId,
    sectionName: section?.name || sectionId,
    date: targetDate,
    totalPredictedRakes: totalPredicted,
    baselineDailyFreightRakes: baselineInfo.baseRakes,
    surgeFactor: parseFloat(surgeMultiplier.toFixed(2)),
    confidenceScore: 0.92,
    timeSlots: slots,
    dominantCargoType: baselineInfo.cargo,
  };
}

/**
 * Computes soft freight congestion penalty for a specific proposed maintenance block window.
 * Returns penalty score (0 to 50): 0 = clear of freight, >0 = potential freight regulation.
 */
export function getFreightImpactForWindow(
  sectionId: string,
  startMinutes: number,
  endMinutes: number,
  date?: string,
  trainMovements: TrainMovement[] = INITIAL_TRAIN_MOVEMENTS
): number {
  const forecast = predictFreightForSection(sectionId, date);

  // Check overlap with time slots
  let penalty = 0;
  for (const slot of forecast.timeSlots) {
    const overlap = Math.max(0, Math.min(endMinutes, slot.endMinutes) - Math.max(startMinutes, slot.startMinutes));
    if (overlap > 30) {
      if (slot.congestionLevel === 'CONGESTED') {
        penalty += 25;
      } else if (slot.congestionLevel === 'HIGH') {
        penalty += 15;
      } else if (slot.congestionLevel === 'MEDIUM') {
        penalty += 5;
      }
    }
  }

  // Also check scheduled freight trains from timetable
  const directFreightOverlap = trainMovements.some(t => {
    if (t.sectionId !== sectionId || t.type !== 'FREIGHT_GOODS') return false;
    const [entryH, entryM] = t.entryTime.split(':').map(Number);
    const [exitH, exitM] = t.exitTime.split(':').map(Number);
    const trnStart = entryH * 60 + entryM;
    const trnEnd = exitH * 60 + exitM;
    return Math.max(0, Math.min(endMinutes, trnEnd) - Math.max(startMinutes, trnStart)) > 0;
  });

  if (directFreightOverlap) {
    penalty += 10;
  }

  return Math.min(50, penalty);
}

/**
 * Predicts multi-day freight rake forecasts across all corridor sections.
 */
export function predictHorizonFreightDemands(
  sections: CorridorSection[] = INITIAL_CORRIDOR_SECTIONS,
  horizonDays: number = 7,
  startDateStr?: string
): SectionFreightForecast[] {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const forecasts: SectionFreightForecast[] = [];

  for (const section of sections) {
    for (let day = 0; day < horizonDays; day++) {
      const d = new Date(start);
      d.setDate(start.getDate() + day);
      const dateStr = d.toISOString().split('T')[0];
      forecasts.push(predictFreightForSection(section.id, dateStr, 0, sections));
    }
  }

  return forecasts;
}
