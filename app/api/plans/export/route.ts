import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { buildHorizonPlan, generatePlanCsv } from '@/app/lib/planBuilder';
import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const horizonParam = (searchParams.get('horizon') || 'WEEKLY').toUpperCase();
    const horizon = (['DAILY', 'WEEKLY', 'MONTHLY'].includes(horizonParam) ? horizonParam : 'WEEKLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    const zone = searchParams.get('zone') || 'ALL';
    const division = searchParams.get('division') || 'ALL';

    const dbTasks = taskStore.getAll();
    const tasks = dbTasks;
    const sections = referenceRepo.sections();
    const trainMovements = referenceRepo.trainMovements();

    const optResult = generateOptimizedBlocks(
      tasks,
      horizon,
      zone !== 'ALL' ? 'ZONE' : division !== 'ALL' ? 'DIVISION' : 'NATIONAL',
      zone,
      division,
      sections,
      trainMovements
    );

    const plan = buildHorizonPlan(optResult.blocks, horizon);
    const csvContent = generatePlanCsv(plan);

    const filename = `IndianRailways_BlockPlan_${horizon}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to export plan CSV';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
