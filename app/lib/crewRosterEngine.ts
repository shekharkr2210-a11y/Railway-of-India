/**
 * Indian Railways Hours of Employment Regulations (HOER) Crew Rostering Engine.
 * Enforces statutory rest periods and night-shift fatigue guards for maintenance gangs:
 * - Civil Engineering Track Gangs
 * - TRD 25kV OHE Linemen & Tower Wagon Drivers
 * - S&T Section Signal Maintainers (ESM/MSM)
 */

import { Department, CrewRosterAssignment, BlockWindow } from './types';
import { timeStringToMinutes, minutesToTimeString } from './timetableEngine';

export interface DepartmentGang {
  gangId: string;
  department: Department;
  name: string;
  homeStation: string;
  lastShiftEnd?: string; // ISO or "YYYY-MM-DD HH:mm"
  totalShiftsThisWeek: number;
}

const DEFAULT_GANGS: DepartmentGang[] = [
  { gangId: 'GANG-ENG-01', department: 'ENG', name: 'Mathura P-Way Heavy Gang #1', homeStation: 'MTJ', totalShiftsThisWeek: 2 },
  { gangId: 'GANG-ENG-02', department: 'ENG', name: 'Agra Cantt P-Way Gang #4', homeStation: 'AGC', totalShiftsThisWeek: 3 },
  { gangId: 'GANG-ENG-03', department: 'ENG', name: 'New Delhi Track Machine Base #7', homeStation: 'NDLS', totalShiftsThisWeek: 1 },
  { gangId: 'GANG-TRD-01', department: 'TRD', name: 'Mathura TRD Sub-Depot Crew #2', homeStation: 'MTJ', totalShiftsThisWeek: 2 },
  { gangId: 'GANG-TRD-02', department: 'TRD', name: 'Palwal 25kV Catenary Gang #1', homeStation: 'PWL', totalShiftsThisWeek: 2 },
  { gangId: 'GANG-SMMS-01', department: 'SMMS', name: 'Tundla Signal Maintenance Squad', homeStation: 'TDL', totalShiftsThisWeek: 3 },
  { gangId: 'GANG-SMMS-02', department: 'SMMS', name: 'Agra Electronic Interlocking Team', homeStation: 'AGC', totalShiftsThisWeek: 1 },
];

/**
 * Validates HOER (Hours of Employment Regulations) compliance for a proposed block shift.
 * Night shifts (possessions between 22:00 and 06:00) require minimum 12 hours rest before next shift.
 * Day shifts require minimum 8 hours rest.
 */
export function checkHOERCompliance(
  gang: DepartmentGang,
  shiftDateStr: string,
  shiftStartMinutes: number,
  shiftEndMinutes: number
): { isCompliant: boolean; requiredRestHours: number; violationReason?: string } {
  let previousWasNight = false;
  if (gang.lastShiftEnd) {
    const lastEndObj = new Date(gang.lastShiftEnd);
    const lastEndH = lastEndObj.getHours();
    previousWasNight = lastEndH >= 22 || lastEndH < 6;
  }

  const isNightShift = (shiftStartMinutes >= 1320 || shiftStartMinutes < 360) || (shiftEndMinutes > 1320 || shiftEndMinutes <= 360);
  const requiredRestHours = (isNightShift || previousWasNight) ? 12 : 8;

  if (gang.lastShiftEnd) {
    const lastEnd = new Date(gang.lastShiftEnd).getTime();
    const currentStart = new Date(`${shiftDateStr}T${minutesToTimeString(shiftStartMinutes)}:00`).getTime();
    const restDurationHours = (currentStart - lastEnd) / (1000 * 60 * 60);

    if (restDurationHours < requiredRestHours) {
      return {
        isCompliant: false,
        requiredRestHours,
        violationReason: `HOER Violation: Gang ${gang.name} only had ${restDurationHours.toFixed(1)}h rest (Statutory requirement is ${requiredRestHours}h).`,
      };
    }
  }

  if (gang.totalShiftsThisWeek >= 6) {
    return {
      isCompliant: false,
      requiredRestHours: 24,
      violationReason: `Weekly Rest Rule: Gang ${gang.name} reached maximum 6 shifts this week. Mandatory 24h rest required.`,
    };
  }

  return { isCompliant: true, requiredRestHours };
}

/**
 * Automatically assigns HOER-compliant maintenance crews and gangs to scheduled block windows.
 */
export function rosterCrewsForBlocks(
  blocks: BlockWindow[],
  availableGangs: DepartmentGang[] = DEFAULT_GANGS
): CrewRosterAssignment[] {
  const assignments: CrewRosterAssignment[] = [];
  const gangState = availableGangs.map(g => ({ ...g }));

  for (const block of blocks) {
    const shiftDate = block.scheduledDate || new Date().toISOString().split('T')[0];
    const startM = timeStringToMinutes(block.startTime);
    const endM = timeStringToMinutes(block.endTime);
    const isNight = (startM >= 1320 || startM < 360) || (endM <= 360);

    for (const dept of block.participatingDepartments) {
      const candidates = gangState.filter(g => g.department === dept);
      if (candidates.length === 0) continue;

      // Pick gang with lowest weekly shifts that satisfies HOER
      let selectedGang: DepartmentGang | null = null;
      let complianceResult = { isCompliant: false, requiredRestHours: 8 };

      for (const candidate of candidates) {
        const check = checkHOERCompliance(candidate, shiftDate, startM, endM);
        if (check.isCompliant) {
          selectedGang = candidate;
          complianceResult = check;
          break;
        }
      }

      // If no fully compliant candidate, fallback to candidate with least shifts and flag
      if (!selectedGang) {
        selectedGang = candidates.sort((a, b) => a.totalShiftsThisWeek - b.totalShiftsThisWeek)[0];
        complianceResult = { isCompliant: false, requiredRestHours: isNight ? 12 : 8 };
      }

      const restEnd = new Date(`${shiftDate}T${block.endTime}:00`);
      restEnd.setHours(restEnd.getHours() + complianceResult.requiredRestHours);

      // Update gang state
      selectedGang.lastShiftEnd = `${shiftDate}T${block.endTime}:00`;
      selectedGang.totalShiftsThisWeek += 1;

      assignments.push({
        gangId: selectedGang.gangId,
        department: dept,
        crewName: selectedGang.name,
        assignedBlockId: block.id,
        shiftDate,
        shiftStart: block.startTime,
        shiftEnd: block.endTime,
        restUntil: restEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNightShift: isNight,
        hoerCompliant: complianceResult.isCompliant,
      });
    }
  }

  return assignments;
}
