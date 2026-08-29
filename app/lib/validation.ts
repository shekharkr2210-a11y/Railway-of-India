import { z } from 'zod';

/**
 * Request validation schemas. All API routes parse with these and return
 * 400 on failure instead of silently coercing invalid input.
 */

export const loginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const horizonEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);
export const scopeEnum = z.enum(['NATIONAL', 'ZONE', 'DIVISION']);
export const departmentEnum = z.enum(['ENG', 'TRD', 'SMMS']);
export const severityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const taskStatusEnum = z.enum(['PENDING', 'SCHEDULED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']);

export const taskSchema = z.object({
  id: z.string().min(1).optional(),
  sourceSystem: z.enum(['TMS', 'SMMS', 'TDMS']).optional(),
  department: departmentEnum,
  departmentName: z.string().optional(),
  zoneCode: z.string().min(1).optional(),
  divisionCode: z.string().min(1).optional(),
  title: z.string().min(1),
  sectionId: z.string().min(1).optional(),
  sectionName: z.string().optional(),
  startKm: z.number().optional(),
  endKm: z.number().optional(),
  estimatedDurationHours: z.number().positive().optional(),
  severity: severityEnum.optional(),
  overdueDays: z.number().int().min(0).optional(),
  requiresPowerBlock: z.boolean().optional(),
  speedRestrictionImpactKmvh: z.number().nonnegative().optional(),
  status: taskStatusEnum.optional(),
  criticalityScore: z.number().min(0).max(100).optional(),
});

export const optimizeSchema = z.object({
  horizon: horizonEnum.default('WEEKLY'),
  scopeLevel: scopeEnum.default('NATIONAL'),
  selectedZone: z.string().default('ALL'),
  selectedDivision: z.string().default('ALL'),
  tasks: z.array(taskSchema.partial()).max(1000, 'Task batch too large (max 1000)').optional(),
});

export const importTasksSchema = z.object({
  tasks: z.array(taskSchema.partial()).min(1).max(5000, 'Import batch too large (max 5000 rows)'),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1, 'Task id is required'),
  updates: taskSchema.partial().passthrough().optional(),
}).passthrough();

export const sanctionSchema = z.object({
  blockId: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const verifySchema = z.object({
  blockId: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  signature: z.string().min(1),
});

export type OptimizeInput = z.infer<typeof optimizeSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ImportInput = z.infer<typeof importTasksSchema>;