import { NextRequest, NextResponse } from 'next/server';
import { syncAllSources, syncSource, getSyncLogs } from '@/app/lib/syncEngine';
import { SupportedSource } from '@/app/lib/sources';
import { taskStore } from '@/app/lib/taskStore';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ source: string }> }
) {
  try {
    const params = await props.params;
    const sourceParam = params.source.toUpperCase();

    if (sourceParam === 'ALL') {
      const results = await syncAllSources();
      const allTasks = taskStore.getAll();
      return NextResponse.json({
        success: true,
        source: 'ALL',
        results,
        totalTasksInDb: allTasks.length,
        tasks: allTasks,
        message: 'Successfully synchronized all Indian Railways core enterprise systems.',
      });
    }

    const validSources: SupportedSource[] = ['TMS', 'SMMS', 'TDMS', 'COA'];
    if (!validSources.includes(sourceParam as SupportedSource)) {
      return NextResponse.json(
        { success: false, error: `Invalid source '${params.source}'. Valid options: TMS, SMMS, TDMS, COA, ALL` },
        { status: 400 }
      );
    }

    const result = await syncSource(sourceParam as SupportedSource);
    const allTasks = taskStore.getAll();

    return NextResponse.json({
      success: true,
      source: sourceParam,
      result,
      totalTasksInDb: allTasks.length,
      tasks: result.tasks,
      message: result.details,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to execute system sync';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const logs = getSyncLogs(25);
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sync logs';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
