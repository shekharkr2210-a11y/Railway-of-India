import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { buildHorizonPlan } from '@/app/lib/planBuilder';
import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const horizonParam = (searchParams.get('horizon') || 'WEEKLY').toUpperCase();
    const horizon = (['DAILY', 'WEEKLY', 'MONTHLY'].includes(horizonParam) ? horizonParam : 'WEEKLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    const zone = searchParams.get('zone') || 'ALL';
    const division = searchParams.get('division') || 'ALL';

    const dbTasks = taskStore.getAll();
    const tasks = dbTasks.length > 0 ? dbTasks : INITIAL_MAINTENANCE_TASKS;
    const sections = referenceRepo.sections().length > 0 ? referenceRepo.sections() : INITIAL_CORRIDOR_SECTIONS;
    const trainMovements = referenceRepo.trainMovements().length > 0 ? referenceRepo.trainMovements() : INITIAL_TRAIN_MOVEMENTS;

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

    return NextResponse.json({
      success: true,
      plan,
      metrics: optResult.metrics,
      recommendations: optResult.recommendations,
      unscheduledTasks: optResult.unscheduledTasks,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate block plan';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
