import { NextResponse, NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/app/lib/session';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: session });
}