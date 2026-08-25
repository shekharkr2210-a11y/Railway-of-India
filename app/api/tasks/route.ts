import { NextResponse, NextRequest } from 'next/server';
import { INITIAL_MAINTENANCE_TASKS } from '@/app/lib/mockData';
import { MaintenanceTask } from '@/app/lib/types';

let serverTasksState: MaintenanceTask[] = [...INITIAL_MAINTENANCE_TASKS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const division = searchParams.get('division');

  let filtered = serverTasksState;
  if (zone && zone !== 'ALL') {
    filtered = filtered.filter(t => t.zoneCode === zone);
  }
  if (division && division !== 'ALL') {
    filtered = filtered.filter(t => t.divisionCode === division);
  }

  return NextResponse.json({
    success: true,
    count: filtered.length,
    tasks: filtered,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTask: MaintenanceTask = {
      id: `TASK-${body.department || 'ENG'}-${Math.floor(100 + Math.random() * 900)}`,
      sourceSystem: body.sourceSystem || 'TMS',
      department: body.department || 'ENG',
      departmentName: body.departmentName || 'Civil Engineering (Track)',
      zoneCode: body.zoneCode || 'NER',
      divisionCode: body.divisionCode || 'LJN',
      title: body.title || 'USFD Rail Flaw Inspection',
      sectionId: body.sectionId || 'SEC-08',
      sectionName: body.sectionName || 'GKP-BST',
      startKm: body.startKm || 20,
      endKm: body.endKm || 25,
      estimatedDurationHours: body.estimatedDurationHours || 2.5,
      severity: body.severity || 'CRITICAL',
      overdueDays: body.overdueDays || 3,
      requiresPowerBlock: body.requiresPowerBlock || false,
      speedRestrictionImpactKmvh: body.speedRestrictionImpactKmvh || 30,
      criticalityScore: body.criticalityScore || 90,
      status: 'PENDING',
    };

    serverTasksState.unshift(newTask);

    return NextResponse.json({
      success: true,
      message: 'Task ingested successfully into backend database queue',
      task: newTask,
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid JSON payload';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 400 });
  }
}
