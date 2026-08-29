import { NextResponse, NextRequest } from 'next/server';
import { INITIAL_MAINTENANCE_TASKS } from '@/app/lib/mockData';
import { MaintenanceTask } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const division = searchParams.get('division');
  const department = searchParams.get('department');
  const severity = searchParams.get('severity');

  let tasks: MaintenanceTask[] = [...INITIAL_MAINTENANCE_TASKS];

  if (zone && zone !== 'ALL') tasks = tasks.filter(t => t.zoneCode === zone);
  if (division && division !== 'ALL') tasks = tasks.filter(t => t.divisionCode === division);
  if (department && department !== 'ALL') tasks = tasks.filter(t => t.department === department);
  if (severity && severity !== 'ALL') tasks = tasks.filter(t => t.severity === severity);

  // Department breakdown
  const byDepartment = {
    ENG: tasks.filter(t => t.department === 'ENG'),
    TRD: tasks.filter(t => t.department === 'TRD'),
    SMMS: tasks.filter(t => t.department === 'SMMS'),
  };

  // Severity breakdown
  const bySeverity = {
    CRITICAL: tasks.filter(t => t.severity === 'CRITICAL'),
    HIGH: tasks.filter(t => t.severity === 'HIGH'),
    MEDIUM: tasks.filter(t => t.severity === 'MEDIUM'),
    LOW: tasks.filter(t => t.severity === 'LOW'),
  };

  // Zone breakdown
  const byZone: Record<string, MaintenanceTask[]> = {};
  tasks.forEach(t => {
    if (!byZone[t.zoneCode]) byZone[t.zoneCode] = [];
    byZone[t.zoneCode].push(t);
  });

  // Work type categorization
  const workTypes = categorizeWorkTypes(tasks);

  // Aging analysis
  const aging = {
    overdue0to3: tasks.filter(t => t.overdueDays >= 0 && t.overdueDays <= 3).length,
    overdue4to7: tasks.filter(t => t.overdueDays >= 4 && t.overdueDays <= 7).length,
    overdue8to14: tasks.filter(t => t.overdueDays >= 8 && t.overdueDays <= 14).length,
    overdue15plus: tasks.filter(t => t.overdueDays >= 15).length,
    averageOverdueDays: tasks.length > 0 ? parseFloat((tasks.reduce((sum, t) => sum + t.overdueDays, 0) / tasks.length).toFixed(1)) : 0,
  };

  // Section-wise summary
  const bySectionMap: Record<string, { sectionName: string; tasks: MaintenanceTask[]; totalHours: number; criticalCount: number }> = {};
  tasks.forEach(t => {
    if (!bySectionMap[t.sectionId]) {
      bySectionMap[t.sectionId] = { sectionName: t.sectionName, tasks: [], totalHours: 0, criticalCount: 0 };
    }
    bySectionMap[t.sectionId].tasks.push(t);
    bySectionMap[t.sectionId].totalHours += t.estimatedDurationHours;
    if (t.severity === 'CRITICAL') bySectionMap[t.sectionId].criticalCount++;
  });

  return NextResponse.json({
    success: true,
    totalPendingTasks: tasks.length,
    totalEstimatedHours: parseFloat(tasks.reduce((sum, t) => sum + t.estimatedDurationHours, 0).toFixed(1)),
    byDepartment: {
      ENG: { count: byDepartment.ENG.length, hours: parseFloat(byDepartment.ENG.reduce((s, t) => s + t.estimatedDurationHours, 0).toFixed(1)), critical: byDepartment.ENG.filter(t => t.severity === 'CRITICAL').length },
      TRD: { count: byDepartment.TRD.length, hours: parseFloat(byDepartment.TRD.reduce((s, t) => s + t.estimatedDurationHours, 0).toFixed(1)), critical: byDepartment.TRD.filter(t => t.severity === 'CRITICAL').length },
      SMMS: { count: byDepartment.SMMS.length, hours: parseFloat(byDepartment.SMMS.reduce((s, t) => s + t.estimatedDurationHours, 0).toFixed(1)), critical: byDepartment.SMMS.filter(t => t.severity === 'CRITICAL').length },
    },
    bySeverity: {
      CRITICAL: bySeverity.CRITICAL.length,
      HIGH: bySeverity.HIGH.length,
      MEDIUM: bySeverity.MEDIUM.length,
      LOW: bySeverity.LOW.length,
    },
    byZone: Object.entries(byZone).map(([code, zoneTasks]) => ({
      zoneCode: code,
      count: zoneTasks.length,
      critical: zoneTasks.filter(t => t.severity === 'CRITICAL').length,
      totalHours: parseFloat(zoneTasks.reduce((s, t) => s + t.estimatedDurationHours, 0).toFixed(1)),
    })),
    bySection: Object.entries(bySectionMap).map(([id, data]) => ({
      sectionId: id,
      sectionName: data.sectionName,
      taskCount: data.tasks.length,
      totalHours: parseFloat(data.totalHours.toFixed(1)),
      criticalCount: data.criticalCount,
    })),
    workTypes,
    aging,
  });
}

function categorizeWorkTypes(tasks: MaintenanceTask[]) {
  const categories: Record<string, { count: number; tasks: string[]; avgCriticality: number }> = {
    'Track Renewal & Tamping': { count: 0, tasks: [], avgCriticality: 0 },
    'Rail Defect Rectification': { count: 0, tasks: [], avgCriticality: 0 },
    'Routine Inspection (USFD/Geometry)': { count: 0, tasks: [], avgCriticality: 0 },
    'OHE Maintenance': { count: 0, tasks: [], avgCriticality: 0 },
    'Signal & Telecom Maintenance': { count: 0, tasks: [], avgCriticality: 0 },
    'Other': { count: 0, tasks: [], avgCriticality: 0 },
  };

  tasks.forEach(t => {
    const titleLower = t.title.toLowerCase();
    let category = 'Other';

    if (titleLower.includes('renewal') || titleLower.includes('tamping') || titleLower.includes('ballast') || titleLower.includes('cleaning')) {
      category = 'Track Renewal & Tamping';
    } else if (titleLower.includes('defect') || titleLower.includes('fracture') || titleLower.includes('weld') || titleLower.includes('rail') || titleLower.includes('grinding')) {
      category = 'Rail Defect Rectification';
    } else if (titleLower.includes('usfd') || titleLower.includes('ultrasonic') || titleLower.includes('geometry') || titleLower.includes('inspection')) {
      category = 'Routine Inspection (USFD/Geometry)';
    } else if (t.department === 'TRD' || titleLower.includes('ohe') || titleLower.includes('traction') || titleLower.includes('cantilever') || titleLower.includes('contact wire') || titleLower.includes('feeder') || titleLower.includes('insulator')) {
      category = 'OHE Maintenance';
    } else if (t.department === 'SMMS' || titleLower.includes('signal') || titleLower.includes('point machine') || titleLower.includes('interlocking') || titleLower.includes('track circuit') || titleLower.includes('relay') || titleLower.includes('ofc')) {
      category = 'Signal & Telecom Maintenance';
    }

    categories[category].count++;
    categories[category].tasks.push(t.id);
    categories[category].avgCriticality += t.criticalityScore;
  });

  // Compute averages
  Object.values(categories).forEach(cat => {
    if (cat.count > 0) cat.avgCriticality = parseFloat((cat.avgCriticality / cat.count).toFixed(1));
  });

  return categories;
}
