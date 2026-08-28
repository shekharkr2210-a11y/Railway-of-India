import { NextResponse, NextRequest } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { MaintenanceTask, TaskSeverity, Department } from '@/app/lib/types';
import { calculateMLCriticality } from '@/app/lib/mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '@/app/lib/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const division = searchParams.get('division');
  const department = searchParams.get('department');
  const severity = searchParams.get('severity');
  const status = searchParams.get('status');

  const filtered = taskStore.getByFilter({ zone, division, department, severity, status });

  return NextResponse.json({
    success: true,
    count: filtered.length,
    tasks: filtered,
  });
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const department: Department = body.department === 'TRD' ? 'TRD' : body.department === 'SMMS' ? 'SMMS' : 'ENG';
    const severity: TaskSeverity = body.severity === 'CRITICAL' ? 'CRITICAL' : body.severity === 'HIGH' ? 'HIGH' : body.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    const newTask: MaintenanceTask = {
      id: body.id || `TASK-${department}-${Date.now()}`,
      sourceSystem: body.sourceSystem || (department === 'ENG' ? 'TMS' : department === 'TRD' ? 'TDMS' : 'SMMS'),
      department,
      departmentName: body.departmentName || (department === 'ENG' ? 'Civil Track (TMS)' : department === 'TRD' ? 'Traction Distribution (TDMS)' : 'Signal & Telecom (SMMS)'),
      zoneCode: body.zoneCode || 'NCR',
      divisionCode: body.divisionCode || 'PRYJ',
      title: body.title || `${department} Maintenance Work Order`,
      sectionId: body.sectionId || 'SEC-03',
      sectionName: body.sectionName || 'MTJ-AGC (KM 140-200)',
      startKm: body.startKm ?? 150,
      endKm: body.endKm ?? 155,
      estimatedDurationHours: body.estimatedDurationHours ?? 2.5,
      severity,
      overdueDays: body.overdueDays ?? 0,
      requiresPowerBlock: Boolean(body.requiresPowerBlock || department === 'TRD'),
      speedRestrictionImpactKmvh: body.speedRestrictionImpactKmvh ?? 0,
      criticalityScore: body.criticalityScore ?? 50,
      status: body.status || 'PENDING',
    };

    const matchedSection = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === newTask.sectionId || s.name === newTask.sectionName);
    newTask.criticalityScore = calculateMLCriticality(newTask, matchedSection);

    taskStore.add(newTask);

    return NextResponse.json({
      success: true,
      message: 'Maintenance task successfully registered in system',
      task: newTask,
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create maintenance task';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Task id is required' }, { status: 400 });
    }

    const updated = taskStore.update(body.id, body.updates || body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: updated,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Task id query param is required' }, { status: 400 });
  }

  const deleted = taskStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Task ${id} deleted successfully`,
  });
}
