import { NextRequest, NextResponse } from 'next/server';
import { planStore } from '@/app/lib/planStore';
import { bdmsFormatter } from '@/app/lib/bdmsFormatter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const format = searchParams.get('format') || 'json';
    
    if (!planId) {
      return NextResponse.json({ success: false, error: 'planId is required' }, { status: 400 });
    }
    
    const plan = planStore.getPlan(planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    if (format === 'csv') {
      const csv = bdmsFormatter.generateCSV(plan.blocks);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bdms_export_${planId}.csv"`,
        },
      });
    } else {
      const docs = bdmsFormatter.formatBatch(plan.blocks);
      return NextResponse.json({ success: true, data: docs });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to export BDMS format';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
