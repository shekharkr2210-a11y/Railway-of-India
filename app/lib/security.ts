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
  wafStatus: 'ACTIVE' | 'DEGRADED' | 'ATTACK_MITIGATED';
  rateLimiterState: 'NORMAL' | 'ELEVATED' | 'STRICT';
  tlsVersion: string;
  zeroTrustAuth: boolean;
  hmacSignaturesActive: boolean;
  activeThreatsBlockedCount: number;
  lastSecurityScan: string;
}

// Input Sanitization against XSS / Injection attacks
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// HMAC-SHA256 Simulated Cryptographic Signature Generator for anti-tamper block sanctions
export function generateDigitalSignature(blockId: string, payload: Record<string, unknown>): string {
  const dataString = `${blockId}:${JSON.stringify(payload)}:IR_RAILWAY_SECRET_KEY_2026`;
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `HMAC-SHA256:${hexHash.toUpperCase()}-SANCTION-VERIFIED`;
}

// Initial Audit Trail Data
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-8801',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
    action: 'BDMS_BLOCK_SANCTION',
    userRole: 'DIVISIONAL_DRM (PRYJ)',
    ipAddress: '10.142.12.89 (Internal Railway Network)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:8F9A4B12-SANCTION-VERIFIED',
    details: 'Sanctioned Combined Block Window BLK-NCR-101 (MTJ-AGC section).',
  },
  {
    id: 'LOG-8802',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
    action: 'AI_OPTIMIZER_EXECUTION',
    userRole: 'BOARD_HQ (Railway Board)',
    ipAddress: '10.200.4.12 (RailTel Secure VPN)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:A1C34E99-SANCTION-VERIFIED',
    details: 'Ran multi-zone optimization across 18 Zonal Railways. 142 cross-zonal conflicts resolved.',
  },
  {
    id: 'LOG-8803',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
    action: 'UNAUTHORIZED_API_ACCESS_ATTEMPT',
    userRole: 'UNKNOWN (External IP)',
    ipAddress: '185.220.101.4 (Blocked Attacker IP)',
    status: 'DENIED',
    digitalSignature: 'SIG-FAILED-INVALID-KEY',
    details: 'WAF Rate Limiter blocked malicious SQL injection payload on /api/blocks endpoint.',
  },
  {
    id: 'LOG-8804',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(),
    action: 'TMS_DATA_FEED_SYNC',
    userRole: 'SYSTEM_DAEMON',
    ipAddress: '10.100.1.5 (mTLS Encrypted Link)',
    status: 'SUCCESS',
    digitalSignature: 'HMAC-SHA256:D7E2119A-SANCTION-VERIFIED',
    details: 'Ingested 1,420 Track Management System defect alerts over TLS 1.3 channel.',
  },
];

export const INITIAL_SECURITY_STATUS: SecurityStatus = {
  wafStatus: 'ACTIVE',
  rateLimiterState: 'STRICT',
  tlsVersion: 'TLS 1.3 + mTLS (Mutual Authentication)',
  zeroTrustAuth: true,
  hmacSignaturesActive: true,
  activeThreatsBlockedCount: 148,
  lastSecurityScan: 'Just now (Zero Critical Vulnerabilities)',
};
