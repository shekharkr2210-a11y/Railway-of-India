import crypto from 'node:crypto';

/**
 * Server-only cryptographic helpers.
 * IMPORTANT: This module must never be imported from client components —
 * it uses Node's crypto and enforces a secure HMAC secret.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userRole: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
  digitalSignature: string;
  details: string;
}

export interface SecurityStatus {
  dbConnected: boolean;
  auditLogCount: number;
  latestAuditEventAt: string | null;
  sessionCookieName: string;
  activeThreatsBlockedCount?: number;
  wafStatus?: string;
  rateLimiterState?: string;
}

export const INITIAL_SECURITY_STATUS: SecurityStatus = {
  dbConnected: true,
  auditLogCount: 148,
  latestAuditEventAt: new Date().toISOString(),
  sessionCookieName: 'ir_session_token',
  activeThreatsBlockedCount: 148,
  wafStatus: 'ACTIVE & FILTERING',
  rateLimiterState: '100 req/min (Nominal)',
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-8841',
    timestamp: '01:45:12',
    action: 'BDMS_BLOCK_SANCTION',
    userRole: 'BOARD_HQ (National)',
    ipAddress: '10.142.12.89 (RailTel Secure LAN)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:7B8F9A312DE10C99',
    details: 'Sanctioned Block Window BLK-NCR-001 on NDLS-FZB corridor.',
  },
  {
    id: 'LOG-8840',
    timestamp: '01:42:08',
    action: 'AI_OPTIMIZER_EXECUTION',
    userRole: 'ZONAL_GM (NCR)',
    ipAddress: '10.200.4.12 (RailTel Gateway)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:A1C49E8203FD5B77',
    details: 'Executed spatial co-location optimizer across 24h horizon. 4 shadow blocks formed.',
  },
  {
    id: 'LOG-8839',
    timestamp: '01:38:55',
    action: 'CRIS_DEFECT_INGESTION',
    userRole: 'SYSTEM (TMS API)',
    ipAddress: '10.198.88.2 (CRIS Enterprise Hub)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:44E119B02D6CA812',
    details: 'Batch ingested 18 ultrasonic rail flaw records for PRYJ division.',
  },
  {
    id: 'LOG-8838',
    timestamp: '01:30:19',
    action: 'UNAUTHORIZED_CROSS_ZONAL_REQ',
    userRole: 'ANONYMOUS (External)',
    ipAddress: '198.51.100.44 (Public WAN)',
    status: 'DENIED',
    digitalSignature: 'HMAC-SHA256:0000000000000000',
    details: 'Blocked attempt to modify block parameters without cryptographic mTLS certificate.',
  },
];

export function getHmacSecret(): string {
  const secret = process.env.HMAC_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('HMAC_SECRET_KEY is required in production. Set it via environment.');
    }
    console.warn('[security] HMAC_SECRET_KEY not set — using insecure dev fallback. NEVER use in production.');
    return 'DEV_INSECURE_HMAC_FALLBACK_KEY';
  }
  return secret;
}

/**
 * Canonical, deterministic JSON serialization (stable key order + no spaces).
 * Both signing and verification MUST use this so JS object key order can never
 * make a valid signature appear invalid (or vice versa).
 */
export function canonicalize(payload: unknown): string {
  const sort = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sort);
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value as Record<string, unknown>).sort()) {
        out[key] = sort((value as Record<string, unknown>)[key]);
      }
      return out;
    }
    return value;
  };
  return JSON.stringify(sort(payload));
}

export function hashPayload(payload: unknown): string {
  return crypto.createHash('sha256').update(canonicalize(payload)).digest('hex');
}

export function generateDigitalSignature(blockId: string, payload: Record<string, unknown>): string {
  const secret = getHmacSecret();
  const data = `${blockId}:${canonicalize(payload)}`;
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex').toUpperCase();
  return `HMAC-SHA256:${hmac}`;
}

export function verifyDigitalSignature(
  blockId: string,
  payload: Record<string, unknown>,
  signature: string
): boolean {
  const expected = generateDigitalSignature(blockId, payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Strips control characters + trims. This is NOT HTML sanitization — rely on React escaping and zod validation for content safety. */
export function stripControlChars(input: string): string {
  if (!input) return '';
  return input.replace(/[\x00-\x1f\x7f]/g, '').trim();
}

/** @deprecated use stripControlChars */
export const sanitizeInput = stripControlChars;
