import { NextResponse, NextRequest } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';
import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { ScopeLevel, MaintenanceTask } from '@/app/lib/types';
import { sanitizeInput } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const validHorizons = ['DAILY', 'WEEKLY', 'MONTHLY'];
    const horizon = (validHorizons.includes(body.horizon) ? body.horizon : 'WEEKLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    
    const validScopes = ['NATIONAL', 'ZONE', 'DIVISION'];
    const scope = (validScopes.includes(body.scopeLevel) ? body.scopeLevel : 'NATIONAL') as ScopeLevel;
    
    const zone = sanitizeInput(body.selectedZone || 'ALL');
    const division = sanitizeInput(body.selectedDivision || 'ALL');
    const solverType = body.solverType === 'PARETO_MULTI_OBJECTIVE' ? 'PARETO_MULTI_OBJECTIVE' : 'GREEDY_2OPT';

    // Query database tasks if not explicitly provided (e.g. by What-If simulator)
    let tasks: MaintenanceTask[];
    if (body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0) {
      tasks = body.tasks;
    } else {
      const dbTasks = taskStore.getByFilter({
        zone: scope === 'ZONE' ? zone : undefined,
        division: scope === 'DIVISION' ? division : undefined,
      });
      tasks = dbTasks.length > 0 ? dbTasks : INITIAL_MAINTENANCE_TASKS;
    }

    const sections = referenceRepo.sections().length > 0 ? referenceRepo.sections() : INITIAL_CORRIDOR_SECTIONS;
    const trainMovements = referenceRepo.trainMovements().length > 0 ? referenceRepo.trainMovements() : INITIAL_TRAIN_MOVEMENTS;

    // Run AI-powered server-side optimization algorithm with timetable constraints
    const result = generateOptimizedBlocks(
      tasks,
      horizon,
      scope,
      zone,
      division,
      sections,
      trainMovements,
      body.startDateStr,
      solverType
    );


    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      horizon,
      scopeLevel: scope,
      selectedZone: zone,
      selectedDivision: division,
      blocksCount: result.blocks.length,
      blocks: result.blocks,
      metrics: result.metrics,
      recommendations: result.recommendations,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to execute AI optimization on server';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
