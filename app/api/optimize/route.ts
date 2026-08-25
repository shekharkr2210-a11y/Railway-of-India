import { NextResponse, NextRequest } from 'next/server';
import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS, INITIAL_TRAIN_MOVEMENTS } from '@/app/lib/mockData';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { ScopeLevel, MaintenanceTask } from '@/app/lib/types';
import { sanitizeInput } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const horizon = (body.horizon || 'WEEKLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    const scope = (body.scopeLevel || 'NATIONAL') as ScopeLevel;
    const zone = sanitizeInput(body.selectedZone || 'ALL');
    const division = sanitizeInput(body.selectedDivision || 'ALL');
    const clientTasks: MaintenanceTask[] = body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0
      ? body.tasks
      : INITIAL_MAINTENANCE_TASKS;

    // Run AI-powered server-side optimization algorithm with timetable constraints
    const result = generateOptimizedBlocks(
      clientTasks,
      horizon,
      scope,
      zone,
      division,
      INITIAL_CORRIDOR_SECTIONS,
      INITIAL_TRAIN_MOVEMENTS
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
