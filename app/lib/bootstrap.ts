import type { Database } from 'better-sqlite3';
import { getDb } from './db';
import { seedIfEmpty } from './seed';

/**
 * Ensures the database is migrated and seeded exactly once per process.
 * Server-only module — never import from client components.
 */

let ready = false;

export function ensureBootstrapped(): Database {
  const db = getDb();
  if (ready) return db;
  seedIfEmpty(db);
  ready = true;
  return db;
}