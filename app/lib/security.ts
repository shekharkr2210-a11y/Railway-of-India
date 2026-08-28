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
}

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
