import { NextResponse, NextRequest } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import type { MaintenanceTask } from '@/app/lib/types';
import { calculateMLCriticality } from '@/app/lib/mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '@/app/lib/mockData';
import { taskSchema } from '@/app/lib/validation';
import { requireRole, isWithinScope, logAudit } from '@/app/lib/auth';

const MUTATION_ROLES = ['BOARD_HQ', 'ZONAL_GM', 'DIVISIONAL_DRM'] as const;

export async function GET(request: NextRequest) {
  const authed = requireRole(request, ['BOARD_HQ', 'ZONAL_GM', 'DIVISIONAL_DRM', 'SECTION_CONTROLLER']);
  if (authed instanceof NextResponse) return authed;

  const { searchParams } = new URL(request.url);
  const filtered = taskStore.getByFilter({
    zone: searchParams.get('zone'),
    division: searchParams.get('division'),
    department: searchParams.get('department'),
    severity: searchParams.get('severity'),
    status: searchParams.get('status'),
  });

  return NextResponse.json({ success: true, count: filtered.length, tasks: filtered });
}

export async function POST(request: NextRequest) {
  const authed = requireRole(request, MUTATION_ROLES);
  if (authed instanceof NextResponse) return authed;
  const session = authed.session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const data = parsed.data;

  const department = data.department ?? 'ENG';
  const zoneCode = data.zoneCode || 'NCR';
  const divisionCode = data.divisionCode || 'PRYJ';
  if (!isWithinScope(session, zoneCode, divisionCode)) {
    return NextResponse.json({ success: false, error: 'Forbidden — zone/division outside your jurisdiction' }, { status: 403 });
  }

  const newTask: MaintenanceTask = {
    id: data.id || `TASK-${department}-${Date.now()}`,
    sourceSystem: data.sourceSystem || (department === 'ENG' ? 'TMS' : department === 'TRD' ? 'TDMS' : 'SMMS'),
    department,
    departmentName: data.departmentName || (department === 'ENG' ? 'Civil Track (TMS)' : department === 'TRD' ? 'Traction Distribution (TDMS)' : 'Signal & Telecom (SMMS)'),
    zoneCode,
    divisionCode,
    title: data.title || `${department} Maintenance Work Order`,
    sectionId: data.sectionId || 'SEC-03',
    sectionName: data.sectionName || 'MTJ-AGC (KM 140-200)',
    startKm: data.startKm ?? 150,
    endKm: data.endKm ?? 155,
    estimatedDurationHours: data.estimatedDurationHours ?? 2.5,
    severity: data.severity ?? 'MEDIUM',
    overdueDays: data.overdueDays ?? 0,
    requiresPowerBlock: data.requiresPowerBlock ?? department === 'TRD',
    speedRestrictionImpactKmvh: data.speedRestrictionImpactKmvh ?? 0,
    criticalityScore: 50,
    status: data.status ?? 'PENDING',
  };

  const matchedSection = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === newTask.sectionId || s.name === newTask.sectionName);
  newTask.criticalityScore = calculateMLCriticality(newTask, matchedSection);

  taskStore.add(newTask);
  logAudit('TASK_CREATED', session, request, 'SUCCESS', `Created task ${newTask.id}: ${newTask.title}`);

  return NextResponse.json({ success: true, message: 'Maintenance task successfully registered in system', task: newTask }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authed = requireRole(request, MUTATION_ROLES);
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }
  const record = body as { id?: unknown; updates?: unknown };
  if (typeof record.id !== 'string' || !record.id) {
    return NextResponse.json({ success: false, error: 'Task id is required' }, { status: 400 });
  }
  const updates = (record.updates && typeof record.updates === 'object' ? record.updates : record) as Record<string, unknown>;
  const validated = taskSchema.partial().safeParse({ ...updates, id: record.id });
  if (!validated.success) {
    return NextResponse.json({ success: false, error: validated.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const rest = validated.data;

  const updated = taskStore.update(record.id, rest);
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }
  logAudit('TASK_UPDATED', authed.session, request, 'SUCCESS', `Updated task ${record.id}`);
  return NextResponse.json({ success: true, message: 'Task updated successfully', task: updated });
}

export async function DELETE(request: NextRequest) {
  const authed = requireRole(request, ['BOARD_HQ']);
  if (authed instanceof NextResponse) return authed;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Task id query param is required' }, { status: 400 });
  }

  const deleted = taskStore.delete(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }
  logAudit('TASK_DELETED', authed.session, request, 'SUCCESS', `Deleted task ${id}`);
  return NextResponse.json({ success: true, message: `Task ${id} deleted successfully` });
}
