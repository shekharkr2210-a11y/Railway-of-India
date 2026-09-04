import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/app/lib/csvParser';
import { referenceRepo } from '@/app/lib/repositories';
import { TrainMovement } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    let csvText: string;
    
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }

    if (!csvText) {
      return NextResponse.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

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
        id: `TRN-${row.train_number || Math.floor(Math.random() * 10000)}-${Date.now()}`,
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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
