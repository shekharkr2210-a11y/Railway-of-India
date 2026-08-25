import { NextResponse } from 'next/server';
import { ZONAL_RAILWAYS, DIVISIONAL_UNITS } from '@/app/lib/mockData';

export async function GET() {
  return NextResponse.json({
    success: true,
    totalZones: ZONAL_RAILWAYS.length,
    totalDivisions: DIVISIONAL_UNITS.length,
    zones: ZONAL_RAILWAYS,
    divisions: DIVISIONAL_UNITS,
  }, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
