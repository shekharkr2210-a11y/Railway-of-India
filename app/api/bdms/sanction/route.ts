import { NextResponse, NextRequest } from 'next/server';
import { generateDigitalSignature, hashPayload } from '@/app/lib/security';
import { sanctionSchema } from '@/app/lib/validation';
import { getSessionFromRequest } from '@/app/lib/session';
import { logAudit } from '@/app/lib/auth';
import { blockWindowsRepo, sanctionsRepo } from '@/app/lib/repositories';

const SANCTION_ROLES = ['DIVISIONAL_DRM', 'ZONAL_GM', 'BOARD_HQ'] as const;

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = sanctionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const { blockId, payload } = parsed.data;

    // Retrieve active session (strict authentication required)
    const session = getSessionFromRequest(request);
    if (!session) {
      logAudit('BDMS_SANCTION_UNAUTHENTICATED', null, request, 'DENIED', `Unauthenticated sanction attempt for block ${blockId}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized — active authenticated session required to sanction blocks' },
        { status: 401 }
      );
    }


    if (!SANCTION_ROLES.includes(session.role as (typeof SANCTION_ROLES)[number])) {
      logAudit('BDMS_SANCTION_UNAUTHORIZED', session, request, 'DENIED', `Role ${session.role} cannot sanction blocks`);
      return NextResponse.json(
        { success: false, error: `Forbidden — role ${session.role} is not permitted to sanction blocks` },
        { status: 403 }
      );
    }

    const signature = generateDigitalSignature(blockId, payload || {});
    const payloadHash = hashPayload(payload || {});
    const now = new Date().toISOString();

    // Check DB record if available, update status if present
    const block = blockWindowsRepo.findByBlockId(blockId);
    if (block) {
      blockWindowsRepo.updateStatus(blockId, 'APPROVED');
    }

    try {
      sanctionsRepo.create({
        blockId,
        signedBy: session.id,
        signedRole: session.role,
        signature,
        payloadHash,
        payload: payload || {},
      });
    } catch {
      // Ignore SQLite constraint error if already logged
    }

    logAudit('BDMS_SANCTION', session, request, 'SUCCESS',
      `Block ${blockId} cryptographically sanctioned (HMAC-SHA256)`);

    return NextResponse.json({
      success: true,
      blockId,
      status: 'SANCTIONED',
      digitalSignature: signature,
      payloadHash,
      timestamp: now,
      sanctioningAuthority: session.role,
      message: `Block Window ${blockId} cryptographically signed and sanctioned in BDMS.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

