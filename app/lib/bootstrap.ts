import type { Database } from 'better-sqlite3';
import { getDb } from './db';

/**
 * Ensures the database is migrated and seeded exactly once per process.
 * Server-only module — never import from client components.
 */

let ready = false;

export function ensureBootstrapped(): Database.Database {
  const db = getDb();
  if (ready) return db;
  // Lazy import to avoid a module-init cycle (seed.ts imports getDb()).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedIfEmpty } = require('./seed') as typeof import('./seed');
  seedIfEmpty(db);
  ready = true;
  return db;
}