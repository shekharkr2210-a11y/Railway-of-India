import { NextResponse, NextRequest } from 'next/server';
import { verifySchema } from '@/app/lib/validation';
import { verifyDigitalSignature } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }

    const { blockId, payload, signature } = parsed.data;
    const isValid = verifyDigitalSignature(blockId, payload || {}, signature);

    return NextResponse.json({
      success: true,
      verified: isValid,
      blockId,
      status: isValid ? 'VALID_SANCTION' : 'TAMPERED_OR_INVALID',
      timestamp: new Date().toISOString(),
      details: isValid
        ? 'Digital signature verified against HMAC-SHA256 server key.'
        : 'Signature mismatch — payload may have been modified after block sanction.',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
