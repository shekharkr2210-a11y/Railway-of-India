import { NextResponse, NextRequest } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { MaintenanceTask, TaskSeverity, Department } from '@/app/lib/types';
import { calculateMLCriticality } from '@/app/lib/mlEngine';
import { referenceRepo } from '@/app/lib/repositories';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }
    const rawTasks = body.tasks;

    if (!rawTasks || !Array.isArray(rawTasks)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payload: tasks array is required',
      }, { status: 400 });
    }

    const importedTasks: MaintenanceTask[] = rawTasks.map((item: Partial<MaintenanceTask>, idx: number) => {
      const department: Department = item.department === 'TRD' ? 'TRD' : item.department === 'SMMS' ? 'SMMS' : 'ENG';
      const severity: TaskSeverity = item.severity === 'CRITICAL' ? 'CRITICAL' : item.severity === 'HIGH' ? 'HIGH' : item.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';
      const sourceSystem = item.sourceSystem || (department === 'ENG' ? 'TMS' : department === 'TRD' ? 'TDMS' : 'SMMS');

      const task: MaintenanceTask = {
        id: item.id || `IMPORT-${department}-${Date.now()}-${idx + 1}`,
        sourceSystem,
        department,
        departmentName: department === 'ENG' ? 'Civil Track (TMS)' : department === 'TRD' ? 'Traction Distribution (TDMS)' : 'Signal & Telecom (SMMS)',
        zoneCode: item.zoneCode || 'NCR',
        divisionCode: item.divisionCode || 'PRYJ',
        title: item.title || `Imported ${department} Maintenance Work Order`,
        sectionId: item.sectionId || 'SEC-01',
        sectionName: item.sectionName || 'NDLS-FZB (KM 0-44)',
        startKm: item.startKm != null ? Number(item.startKm) : 10,
        endKm: item.endKm != null ? Number(item.endKm) : 12,
        estimatedDurationHours: item.estimatedDurationHours != null ? Number(item.estimatedDurationHours) : 2.0,
        severity,
        overdueDays: item.overdueDays != null ? Number(item.overdueDays) : 0,
        requiresPowerBlock: Boolean(item.requiresPowerBlock || department === 'TRD'),
        speedRestrictionImpactKmvh: item.speedRestrictionImpactKmvh != null ? Number(item.speedRestrictionImpactKmvh) : 0,
        criticalityScore: 50,
        status: 'PENDING',
      };

      const sections = referenceRepo.sections();
      const matchedSection = sections.find(s => s.id === task.sectionId || s.name === task.sectionName);
      task.criticalityScore = calculateMLCriticality(task, matchedSection);

      return task;
    });

    taskStore.addBatch(importedTasks);

    return NextResponse.json({
      success: true,
      importedCount: importedTasks.length,
      tasks: importedTasks,
      message: `Successfully imported ${importedTasks.length} defect tasks from external enterprise feeds.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to import maintenance tasks';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
