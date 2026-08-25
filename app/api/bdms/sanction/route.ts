import { NextResponse, NextRequest } from 'next/server';
import { generateDigitalSignature } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.blockId) {
      return NextResponse.json({
        success: false,
        error: 'blockId parameter is required',
      }, { status: 400 });
    }

    const signature = generateDigitalSignature(body.blockId, body.payload || {});

    return NextResponse.json({
      success: true,
      blockId: body.blockId,
      status: 'SANCTIONED',
      digitalSignature: signature,
      timestamp: new Date().toISOString(),
      sanctioningAuthority: body.userRole || 'DIVISIONAL_DRM',
      message: `Block Window ${body.blockId} cryptographically signed and sanctioned in BDMS.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
