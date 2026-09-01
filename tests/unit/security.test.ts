import { describe, it, expect } from 'vitest';
import { 
  generateDigitalSignature, 
  verifyDigitalSignature, 
  canonicalize, 
  hashPayload 
} from '@/app/lib/security';

describe('security and HMAC signing', () => {
  it('generates deterministic canonical JSON regardless of key order', () => {
    const obj1 = { zone: 'NCR', depts: ['ENG', 'TRD'], duration: 2.5 };
    const obj2 = { duration: 2.5, depts: ['ENG', 'TRD'], zone: 'NCR' };

    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(hashPayload(obj1)).toBe(hashPayload(obj2));
  });

  it('generates HMAC-SHA256 signatures and verifies authentic payloads', () => {
    const blockId = 'BLK-NCR-101';
    const payload = { corridor: 'NDLS-FZB', durationHours: 3.0, depts: ['ENG'] };

    const sig = generateDigitalSignature(blockId, payload);
    expect(sig.startsWith('HMAC-SHA256:')).toBe(true);

    const isValid = verifyDigitalSignature(blockId, payload, sig);
    expect(isValid).toBe(true);
  });

  it('rejects tampered payloads with cryptographic verification failure', () => {
    const blockId = 'BLK-NCR-101';
    const payload = { corridor: 'NDLS-FZB', durationHours: 3.0, depts: ['ENG'] };
    const sig = generateDigitalSignature(blockId, payload);

    // Tamper with payload (e.g. unauthorized duration extension)
    const tamperedPayload = { corridor: 'NDLS-FZB', durationHours: 5.5, depts: ['ENG'] };
    const isValid = verifyDigitalSignature(blockId, tamperedPayload, sig);

    expect(isValid).toBe(false);
  });
});
