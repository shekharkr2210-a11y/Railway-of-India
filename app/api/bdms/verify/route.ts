import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { blockId, payload, signature } = body;
    if (!blockId || !signature) {
      return NextResponse.json({ success: false, error: 'blockId and signature are required' }, { status: 400 });
    }

    const secret = process.env.HMAC_SECRET_KEY || 'IR_RAILWAY_DEFAULT_DEV_KEY_2026';
    const data = `${blockId}:${JSON.stringify(payload || {})}`;
    const expectedHmac = `HMAC-SHA256:${crypto.createHmac('sha256', secret).update(data).digest('hex').toUpperCase()}`;

    const isValid = signature === expectedHmac;

    return NextResponse.json({
      success: true,
      verified: isValid,
      blockId,
      status: isValid ? 'VALID_SANCTION' : 'TAMPERED_OR_INVALID',
      timestamp: new Date().toISOString(),
      details: isValid 
        ? 'Digital signature mathematically verified against CRIS Railway Authority Root Key.'
        : 'Signature mismatch! Payload may have been modified after block sanction.',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
