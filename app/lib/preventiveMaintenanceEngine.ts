import { MaintenanceTask, CorridorSection, Department } from './types';

// Indian Railways Standard Maintenance Cycles (as per IRPWM / IRCAM norms)
export interface MaintenanceCycle {
  id: string;
  category: string;
  department: Department;
  activity: string;
  frequencyDays: number; // Cycle frequency in days
  applicableRouteClass: 'A' | 'B' | 'C' | 'D' | 'ALL';
  estimatedDurationHours: number;
  requiresPowerBlock: boolean;
  description: string;
}

export const STANDARD_MAINTENANCE_CYCLES: MaintenanceCycle[] = [
  // Civil Engineering (IRPWM)
  {
    id: 'PMC-ENG-01',
    category: 'Track Geometry Recording',
    department: 'ENG',
    activity: 'Track Recording Car (TRC) Run',
    frequencyDays: 120,
    applicableRouteClass: 'A',
    estimatedDurationHours: 4.0,
    requiresPowerBlock: false,
    description: 'Track geometry recording using TRC for all Group A routes every 4 months as per IRPWM Chapter 3.',
  },
  {
    id: 'PMC-ENG-02',
    category: 'USFD Rail Testing',
    department: 'ENG',
    activity: 'Ultrasonic Flaw Detection (USFD) Testing',
    frequencyDays: 120,
    applicableRouteClass: 'A',
    estimatedDurationHours: 3.0,
    requiresPowerBlock: false,
    description: 'USFD rail testing every 4 months for high-density routes; 6 months for B class.',
  },
  {
    id: 'PMC-ENG-03',
    category: 'Deep Screening',
    department: 'ENG',
    activity: 'Ballast Cleaning Machine (BCM) Deep Screening',
    frequencyDays: 1825,
    applicableRouteClass: 'A',
    estimatedDurationHours: 6.0,
    requiresPowerBlock: false,
    description: 'Complete ballast deep screening cycle every 5 years for main trunk routes.',
  },
  {
    id: 'PMC-ENG-04',
    category: 'Tamping',
    department: 'ENG',
    activity: 'Continuous Track Tamping Machine (CSM) Run',
    frequencyDays: 365,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 4.0,
    requiresPowerBlock: false,
    description: 'Annual mechanized tamping for all routes to maintain track geometry.',
  },
  // Traction Distribution (IRCAM / TRD Manual)
  {
    id: 'PMC-TRD-01',
    category: 'OHE Contact Wire',
    department: 'TRD',
    activity: 'Contact Wire Height & Stagger Measurement',
    frequencyDays: 180,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 3.0,
    requiresPowerBlock: true,
    description: 'Bi-annual contact wire height and stagger measurement using OHE inspection car.',
  },
  {
    id: 'PMC-TRD-02',
    category: 'Insulator Cleaning',
    department: 'TRD',
    activity: '25kV Insulator Cleaning & Thermal Scan',
    frequencyDays: 365,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 2.5,
    requiresPowerBlock: true,
    description: 'Annual cleaning and thermal scan of OHE insulators to prevent flashover.',
  },
  {
    id: 'PMC-TRD-03',
    category: 'Mast Foundation',
    department: 'TRD',
    activity: 'OHE Mast Foundation & Earthing Verification',
    frequencyDays: 365,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 2.0,
    requiresPowerBlock: false,
    description: 'Annual verification of OHE mast foundation integrity and earthing resistance.',
  },
  // Signal & Telecom (SEM / SMMS norms)
  {
    id: 'PMC-SMMS-01',
    category: 'Point Machine',
    department: 'SMMS',
    activity: 'Point Machine Overhaul & Calibration',
    frequencyDays: 365,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 2.0,
    requiresPowerBlock: false,
    description: 'Annual point machine overhaul including stroke measurement and lock testing.',
  },
  {
    id: 'PMC-SMMS-02',
    category: 'Relay Testing',
    department: 'SMMS',
    activity: 'Safety Relay Periodic Testing',
    frequencyDays: 730,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 1.5,
    requiresPowerBlock: false,
    description: 'Bi-annual testing of safety-critical relays as per SEM Part III.',
  },
  {
    id: 'PMC-SMMS-03',
    category: 'Track Circuit',
    department: 'SMMS',
    activity: 'Track Circuit & Axle Counter Calibration',
    frequencyDays: 180,
    applicableRouteClass: 'ALL',
    estimatedDurationHours: 2.0,
    requiresPowerBlock: false,
    description: 'Bi-annual track circuit tuning and axle counter verification.',
  },
];

// Check which scheduled preventive maintenance activities are coming due or overdue
export interface PreventiveMaintenanceStatus {
  cycleId: string;
  activity: string;
  department: Department;
  sectionId: string;
  sectionName: string;
  lastPerformedDate: string | null; // ISO date or null if never performed
  nextDueDate: string;
  daysUntilDue: number; // Negative = overdue
  status: 'OVERDUE' | 'DUE_THIS_WEEK' | 'DUE_THIS_MONTH' | 'ON_SCHEDULE';
  estimatedDurationHours: number;
  requiresPowerBlock: boolean;
}

// Generate preventive maintenance schedule for all sections
export function generatePreventiveMaintenanceSchedule(
  sections: CorridorSection[],
  existingTasks: MaintenanceTask[]
): PreventiveMaintenanceStatus[] {
  const statuses: PreventiveMaintenanceStatus[] = [];
  const today = new Date();

  sections.forEach(section => {
    // Determine route class based on traffic density
    const routeClass = section.trafficDensity === 'VERY_HIGH' ? 'A' : section.trafficDensity === 'HIGH' ? 'B' : 'C';

    STANDARD_MAINTENANCE_CYCLES.forEach(cycle => {
      // Check if this cycle applies to this route class
      if (cycle.applicableRouteClass !== 'ALL' && cycle.applicableRouteClass !== routeClass) return;

      // Check if there's a matching recent task that covers this cycle
      const matchingTasks = existingTasks.filter(t =>
        t.sectionId === section.id &&
        t.department === cycle.department &&
        t.title.toLowerCase().includes(cycle.category.toLowerCase().split(' ')[0])
      );

      // Simulate last performed date based on existing task data
      let lastPerformed: Date | null = null;
      if (matchingTasks.length > 0) {
        // If there's an existing matching task, simulate that it was done overdueDays ago
        const mostRecentTask = matchingTasks.sort((a, b) => a.overdueDays - b.overdueDays)[0];
        lastPerformed = new Date(today);
        lastPerformed.setDate(today.getDate() - cycle.frequencyDays + mostRecentTask.overdueDays);
      } else {
        // No matching task — simulate random past performance
        lastPerformed = new Date(today);
        const randomDaysAgo = Math.floor(cycle.frequencyDays * (0.6 + Math.random() * 0.6));
        lastPerformed.setDate(today.getDate() - randomDaysAgo);
      }

      const nextDue = new Date(lastPerformed);
      nextDue.setDate(lastPerformed.getDate() + cycle.frequencyDays);
      const daysUntilDue = Math.round((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let status: PreventiveMaintenanceStatus['status'] = 'ON_SCHEDULE';
      if (daysUntilDue < 0) status = 'OVERDUE';
      else if (daysUntilDue <= 7) status = 'DUE_THIS_WEEK';
      else if (daysUntilDue <= 30) status = 'DUE_THIS_MONTH';

      statuses.push({
        cycleId: `${cycle.id}-${section.id}`,
        activity: cycle.activity,
        department: cycle.department,
        sectionId: section.id,
        sectionName: section.name,
        lastPerformedDate: lastPerformed.toISOString().split('T')[0],
        nextDueDate: nextDue.toISOString().split('T')[0],
        daysUntilDue,
        status,
        estimatedDurationHours: cycle.estimatedDurationHours,
        requiresPowerBlock: cycle.requiresPowerBlock,
      });
    });
  });

  // Sort by urgency: overdue first, then due this week, etc.
  return statuses.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
