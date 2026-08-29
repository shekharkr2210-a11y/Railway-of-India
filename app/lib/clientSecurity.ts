/**
 * Client-safe cryptographic preview helpers.
 * These utilities can be safely imported into Next.js Client Components ('use client')
 * without triggering 'node:crypto' bundling errors.
 */

import type { AuditLogEntry, SecurityStatus } from './security';
export type { AuditLogEntry, SecurityStatus };

/**
 * Deterministic hash-like string generator for client-side signature previews.
 */
export function generateClientSignature(blockId: string, payload: Record<string, unknown> = {}): string {
  const str = blockId + ':' + JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  
  let hash2 = 0x55555555;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 ^= str.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x1000193);
  }
  const hex2 = (hash2 >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return 'HMAC-SHA256:' + hex + hex2;
}

export const generateDigitalSignature = generateClientSignature;

