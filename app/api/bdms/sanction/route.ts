import { NextResponse, NextRequest } from 'next/server';
import { generateDigitalSignature } from '@/app/lib/security';
import { sanctionSchema } from '@/app/lib/validation';
import { requireRole, logAudit } from '@/app/lib/auth';
import { blockWindowsRepo, sanctionsRepo } from '@/app/lib/repositories';

const SANCTION_ROLES = ['DIVISIONAL_DRM', 'ZONAL_GM', 'BOARD_HQ'] as const;

export async function POST(request: NextRequest) {
  try {
    const authed = requireRole(request, [...SANCTION_ROLES]);
    if (authed instanceof NextResponse) return authed;
    const session = (authed as { session: { id: string; role: string } }).session;

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

    const block = blockWindowsRepo.findByBlockId(blockId);
    if (!block) {
      logAudit('BDMS_SANCTION_FAILED', session as any, request, 'DENIED', `Block ${blockId} not found`);
      return NextResponse.json({ success: false, error: `Block window ${blockId} not found` }, { status: 404 });
    }

    const signature = generateDigitalSignature(blockId, payload || {});
    const payloadHash = generateDigitalSignature(JSON.stringify(payload || {}), {});

    const now = new Date().toISOString();
    sanctionsRepo.create({
      blockId,
      signedBy: session.id,
      signedRole: session.role,
      signature,
      payloadHash,
      payload: payload || {},
    });

    blockWindowsRepo.updateStatus(blockId, 'APPROVED');

    logAudit('BDMS_SANCTION', session as any, request, 'SUCCESS',
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
