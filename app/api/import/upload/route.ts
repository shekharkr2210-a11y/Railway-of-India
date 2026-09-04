import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/app/lib/csvParser';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';
import { MaintenanceTask, TrainMovement } from '@/app/lib/types';
import { calculateMLCriticality } from '@/app/lib/mlEngine';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceSystem = formData.get('sourceSystem') as string | null;

    if (!file || !sourceSystem) {
      return NextResponse.json({ success: false, error: 'Missing file or sourceSystem' }, { status: 400 });
    }

    const csvText = await file.text();
    
    if (sourceSystem === 'COA') {
      const parsed = parseCSV<TrainMovement>(csvText, {
        columnMapping: {
          train_number: 'trainNumber',
          train_name: 'trainName',
          type: 'type',
          section_id: 'sectionId',
          origin_zone: 'originZone',
          destination_zone: 'destinationZone',
          entry_time: 'entryTime',
          exit_time: 'exitTime',
          priority: 'priority'
        },
        transform: (row) => ({
          id: `TRN-${row.train_number}-${Date.now()}`,
          priority: parseInt(row.priority, 10) || 1
        })
      });

      if (parsed.data.length > 0) {
        referenceRepo.upsertTrainMovements(parsed.data);
      }

      return NextResponse.json({
        success: true,
        importedCount: parsed.data.length,
        errors: parsed.errors,
      });
    } else {
      // It's a task import (TMS, SMMS, TDMS)
      const department = sourceSystem === 'TMS' ? 'ENG' : sourceSystem === 'TDMS' ? 'TRD' : 'SMMS';
      
      const parsed = parseCSV<MaintenanceTask>(csvText, {
        columnMapping: {
          defect_id: 'id',
          section_id: 'sectionId',
          section_name: 'sectionName',
          zone_code: 'zoneCode',
          division_code: 'divisionCode',
          title: 'title',
          severity: 'severity',
          overdue_days: 'overdueDays',
          start_km: 'startKm',
          end_km: 'endKm',
          duration_hours: 'estimatedDurationHours',
          speed_restriction: 'speedRestrictionImpactKmvh',
          requires_power_block: 'requiresPowerBlock'
        },
        transform: (row) => {
          const task: Partial<MaintenanceTask> = {
            sourceSystem: sourceSystem as MaintenanceTask['sourceSystem'],
            department,
            departmentName: department === 'ENG' ? 'Civil Track' : department === 'TRD' ? 'Traction Distribution' : 'Signal & Telecom',
            startKm: parseFloat(row.start_km) || 0,
            endKm: parseFloat(row.end_km) || 0,
            estimatedDurationHours: parseFloat(row.duration_hours) || 2,
            overdueDays: parseInt(row.overdue_days, 10) || 0,
            speedRestrictionImpactKmvh: parseFloat(row.speed_restriction) || 0,
            requiresPowerBlock: row.requires_power_block === 'true' || row.requires_power_block === '1' || row.requires_power_block === 'yes',
            status: 'PENDING',
            severity: row.severity || 'MEDIUM',
            criticalityScore: 50
          };
          
          if (!row.defect_id) {
            task.id = `${sourceSystem}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
          
          return task;
        }
      });

      const sections = referenceRepo.sections();

      const tasksToInsert = parsed.data.map(task => {
        const section = sections.find(s => s.id === task.sectionId || s.name === task.sectionName);
        return {
          ...task,
          criticalityScore: calculateMLCriticality(task, section)
        };
      });

      if (tasksToInsert.length > 0) {
        taskStore.addBatch(tasksToInsert);
      }

      return NextResponse.json({
        success: true,
        importedCount: tasksToInsert.length,
        errors: parsed.errors,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
