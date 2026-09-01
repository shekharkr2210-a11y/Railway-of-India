import { describe, it, expect } from 'vitest';
import { authenticateWithPassword } from '@/app/lib/auth';
import { createSessionToken, verifySessionToken } from '@/app/lib/session';

describe('Authentication & Session Integration', () => {
  it('authenticates seeded users with correct credentials', () => {
    const user = authenticateWithPassword('admin@indianrailways.gov.in', 'dev-admin1234');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('BOARD_HQ');
    expect(user?.email).toBe('admin@indianrailways.gov.in');
  });

  it('rejects authentication with invalid password', () => {
    const user = authenticateWithPassword('admin@indianrailways.gov.in', 'wrongpassword');
    expect(user).toBeNull();
  });

  it('creates and verifies cryptographically signed session tokens', () => {
    const user = {
      id: 'usr-board-hq',
      name: 'Dr. V. K. Tripathi',
      email: 'admin@indianrailways.gov.in',
      role: 'BOARD_HQ' as const,
      zoneCode: '',
      divisionCode: '',
    };

    const token = createSessionToken(user);
    expect(token).toBeDefined();

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user.id);
    expect(verified?.role).toBe('BOARD_HQ');
  });

  it('rejects tampered session tokens', () => {
    const user = {
      id: 'usr-board-hq',
      name: 'Dr. V. K. Tripathi',
      email: 'admin@indianrailways.gov.in',
      role: 'BOARD_HQ' as const,
      zoneCode: '',
      divisionCode: '',
    };

    const token = createSessionToken(user);
    const tampered = token.slice(0, -5) + 'AAAAA';

    const verified = verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});
