import { NextResponse, NextRequest } from 'next/server';
import { MaintenanceTask, TaskSeverity, Department } from '@/app/lib/types';
import { calculateMLCriticality } from '@/app/lib/mlEngine';
import { INITIAL_CORRIDOR_SECTIONS } from '@/app/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        startKm: Number(item.startKm) || 10,
        endKm: Number(item.endKm) || 12,
        estimatedDurationHours: Number(item.estimatedDurationHours) || 2.0,
        severity,
        overdueDays: Number(item.overdueDays) || 0,
        requiresPowerBlock: Boolean(item.requiresPowerBlock || department === 'TRD'),
        speedRestrictionImpactKmvh: Number(item.speedRestrictionImpactKmvh) || 0,
        criticalityScore: 50,
        status: 'PENDING',
      };

      const matchedSection = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === task.sectionId || s.name === task.sectionName);
      task.criticalityScore = calculateMLCriticality(task, matchedSection);

      return task;
    });

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
