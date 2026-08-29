import { MaintenanceTask, ScopeLevel, BlockWindow, OptimizationMetrics } from './types';
import { AuditLogEntry, SecurityStatus } from './security';

export interface OptimizationApiResponse {
  success: boolean;
  blocks: BlockWindow[];
  metrics: OptimizationMetrics;
  recommendations?: string[];
  error?: string;
}

export interface SanctionApiResponse {
  success: boolean;
  blockId: string;
  digitalSignature: string;
  status: string;
  error?: string;
}

export interface ImportApiResponse {
  success: boolean;
  importedCount: number;
  tasks: MaintenanceTask[];
  message: string;
  error?: string;
}

// Fetch Zonal Railways Data from Backend
export async function fetchBackendZones() {
  const res = await fetch('/api/zones');
  if (!res.ok) throw new Error('Failed to fetch backend zones');
  return res.json();
}

// Fetch Tasks from Backend
export async function fetchBackendTasks(zone = 'ALL', division = 'ALL') {
  const res = await fetch(`/api/tasks?zone=${zone}&division=${division}`);
  if (!res.ok) throw new Error('Failed to fetch backend tasks');
  return res.json();
}

// Ingest New Task to Backend API
export async function ingestBackendTask(taskPayload: Partial<MaintenanceTask>) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskPayload),
  });
  if (!res.ok) throw new Error('Failed to ingest task into backend');
  return res.json();
}

// Batch Import Tasks to Backend API
export async function batchImportTasks(tasks: Partial<MaintenanceTask>[]): Promise<ImportApiResponse> {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) throw new Error('Failed to import tasks batch');
  return res.json();
}

// Run Server-Side AI Optimization API
export async function runServerOptimization(
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  scopeLevel: ScopeLevel,
  selectedZone: string,
  selectedDivision: string,
  tasks: MaintenanceTask[]
): Promise<OptimizationApiResponse> {
  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      horizon,
      scopeLevel,
      selectedZone,
      selectedDivision,
      tasks,
    }),
  });
  if (!res.ok) throw new Error('Server optimization endpoint failed');
  return res.json();
}

// Post Cryptographic BDMS Sanction to Backend
export async function postBackendBdmsSanction(
  blockId: string,
  userRole: string,
  payload: Record<string, unknown>
): Promise<SanctionApiResponse> {
  const res = await fetch('/api/bdms/sanction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blockId,
      userRole,
      payload,
    }),
  });
  if (!res.ok) throw new Error('Backend BDMS sanction endpoint failed');
  return res.json();
}

// Fetch Security Audit Stream from Backend
export async function fetchBackendSecurityLogs(): Promise<{ success: boolean; securityStatus: SecurityStatus; auditLogs: AuditLogEntry[] }> {
  const res = await fetch('/api/security/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch backend audit logs');
  return res.json();
}

// Authentication API helpers
export async function loginUser(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed');
  }
  return data;
}

export async function logoutUser() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
  });
  return res.json();
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

// Password Reset OTP helpers
export async function requestPasswordResetOtp(email: string) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request OTP');
  }
  return data;
}

export async function verifyPasswordResetOtp(email: string, otp: string) {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'OTP verification failed');
  }
  return data;
}

export async function resetUserPassword(email: string, otp: string, newPassword: string) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
  return data;
}

// System Settings API helpers
export async function fetchSystemSettings() {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch system settings');
  return res.json();
}

export async function saveSystemSettings(config: Record<string, unknown>) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save system settings');
  return data;
}
