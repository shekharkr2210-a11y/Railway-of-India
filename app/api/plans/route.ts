import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/app/lib/taskStore';
import { referenceRepo } from '@/app/lib/repositories';
import { generateOptimizedBlocks } from '@/app/lib/optimizer';
import { buildHorizonPlan } from '@/app/lib/planBuilder';
import { planStore, PlanRecord } from '@/app/lib/planStore';
import { notificationEngine } from '@/app/lib/notificationEngine';
import { MaintenanceTask, BlockWindow, ScopeLevel } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const list = searchParams.get('list');

    if (id) {
      const plan = planStore.getPlan(id);
      if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
      return NextResponse.json({ success: true, plan });
    }

    if (list === 'true') {
      const plans = planStore.listPlans();
      return NextResponse.json({ success: true, plans });
    }

    const horizonParam = (searchParams.get('horizon') || 'WEEKLY').toUpperCase();
    const horizon = (['DAILY', 'WEEKLY', 'MONTHLY'].includes(horizonParam) ? horizonParam : 'WEEKLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
    const zone = searchParams.get('zone') || 'ALL';
    const division = searchParams.get('division') || 'ALL';

    const tasks = taskStore.getAll();
    if (tasks.length === 0) {
      return NextResponse.json({ success: false, error: 'No tasks found. Please import data first.' }, { status: 400 });
    }

    const sections = referenceRepo.sections();
    if (sections.length === 0) {
      return NextResponse.json({ success: false, error: 'No corridor sections found.' }, { status: 400 });
    }

    const trainMovements = referenceRepo.trainMovements();

    // Collect previous unscheduled tasks from the most recently saved plans of similar horizon/scope
    const previousUnscheduledTasks: MaintenanceTask[] = [];
    const allPlans = planStore.listPlans();
    if (allPlans.length > 0) {
      // Just taking the latest plan's unscheduled tasks to carry forward
      const latestPlan = allPlans[0];
      previousUnscheduledTasks.push(...latestPlan.unscheduledTasks);
    }

    const optResult = generateOptimizedBlocks(
      tasks,
      horizon,
      zone !== 'ALL' ? 'ZONE' : division !== 'ALL' ? 'DIVISION' : 'NATIONAL',
      zone,
      division,
      sections,
      trainMovements,
      undefined,
      'GREEDY_2OPT',
      previousUnscheduledTasks
    );

    const generatedPlan = buildHorizonPlan(optResult.blocks, horizon);

    return NextResponse.json({
      success: true,
      plan: generatedPlan,
      metrics: optResult.metrics,
      recommendations: optResult.recommendations,
      unscheduledTasks: optResult.unscheduledTasks,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate block plan';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, horizon, scopeLevel, zoneCode, divisionCode, blocks, metrics, recommendations, unscheduledTasks } = body;
    
    const id = `PLAN-${Date.now().toString(36).toUpperCase()}`;
    
    const plan: PlanRecord = {
      id,
      name: name || `${horizon} Block Plan`,
      horizon,
      scopeLevel: scopeLevel || 'NATIONAL',
      zoneCode: zoneCode || null,
      divisionCode: divisionCode || null,
      status: 'DRAFT',
      version: 1,
      parentPlanId: null,
      blocks,
      metrics,
      recommendations,
      unscheduledTasks,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    planStore.savePlan(plan);
    
    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to save plan';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }
    
    const plan = planStore.getPlan(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    planStore.updatePlanStatus(id, status);
    
    if (status === 'PROPOSED') {
      notificationEngine.autoGenerateApprovalNeeded(id);
    } else if (status === 'PUBLISHED') {
      notificationEngine.autoGeneratePlanPublished(id);
    }
    
    return NextResponse.json({ success: true, message: `Plan status updated to ${status}` });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update plan status';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
