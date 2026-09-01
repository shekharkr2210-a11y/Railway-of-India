import type { Database } from 'better-sqlite3';
import { ensureBootstrapped } from './bootstrap';
import { SOURCE_ADAPTERS, SourceAdapter, SourceSyncResult, SupportedSource } from './sources';
import { taskStore } from './taskStore';
import { MaintenanceTask, TrainMovement } from './types';

const db: Database = ensureBootstrapped();

export async function syncSource(source: SupportedSource): Promise<SourceSyncResult> {
  const adapter = SOURCE_ADAPTERS[source];
  if (!adapter) {
    throw new Error(`Unsupported source adapter: ${source}`);
  }

  const latestSync = db
    .prepare('SELECT watermark FROM source_syncs WHERE source_system = ? ORDER BY synced_at DESC LIMIT 1')
    .get(source) as { watermark: string } | undefined;

  const currentWatermark = latestSync?.watermark;
  const updateData = await adapter.fetchUpdates(currentWatermark);

  const canonicalTasks: MaintenanceTask[] = updateData.tasks.map(t => adapter.mapToCanonicalTask(t));
  const newTrains: TrainMovement[] = updateData.trains || [];

  // Transactionally persist tasks, trains, and sync log entry
  db.transaction(() => {
    if (canonicalTasks.length > 0) {
      taskStore.addBatch(canonicalTasks);
    }

    if (newTrains.length > 0) {
      const insTrain = db.prepare(
        `INSERT OR REPLACE INTO train_movements (id, train_number, train_name, type, section_id, origin_zone, destination_zone, entry_time, exit_time, priority)
         VALUES (@id, @trainNumber, @trainName, @type, @sectionId, @originZone, @destinationZone, @entryTime, @exitTime, @priority)`
      );
      for (const trn of newTrains) {
        insTrain.run(trn);
      }
    }

    const logId = `SYNC-${source}-${Date.now()}`;
    db.prepare(
      `INSERT INTO source_syncs (id, source_system, watermark, records_synced, status, error_details, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      logId,
      source,
      updateData.watermark,
      canonicalTasks.length + newTrains.length,
      'SUCCESS',
      null,
      new Date().toISOString()
    );
  })();

  return {
    sourceSystem: source,
    watermark: updateData.watermark,
    recordsSynced: canonicalTasks.length + newTrains.length,
    tasksInserted: canonicalTasks.length,
    trainsUpdated: newTrains.length,
    status: 'SUCCESS',
    details: `Ingested ${canonicalTasks.length} maintenance tasks and ${newTrains.length} train movements from ${adapter.name}.`,
    timestamp: new Date().toISOString(),
    tasks: canonicalTasks,
    trains: newTrains,
  };
}

export async function syncAllSources(): Promise<SourceSyncResult[]> {
  const sources: SupportedSource[] = ['TMS', 'SMMS', 'TDMS', 'COA'];
  const results: SourceSyncResult[] = [];

  for (const s of sources) {
    try {
      const res = await syncSource(s);
      results.push(res);
    } catch (err) {
      results.push({
        sourceSystem: s,
        watermark: 'FAILED',
        recordsSynced: 0,
        tasksInserted: 0,
        trainsUpdated: 0,
        status: 'FAILED',
        details: err instanceof Error ? err.message : 'Unknown sync failure',
        timestamp: new Date().toISOString(),
        tasks: [],
      });
    }
  }

  return results;
}

export function getSyncLogs(limit: number = 20): Array<{
  id: string;
  sourceSystem: string;
  watermark: string;
  recordsSynced: number;
  status: string;
  syncedAt: string;
}> {
  const rows = db
    .prepare(
      'SELECT id, source_system, watermark, records_synced, status, synced_at FROM source_syncs ORDER BY synced_at DESC LIMIT ?'
    )
    .all(limit) as unknown as Array<{
      id: string;
      source_system: string;
      watermark: string;
      records_synced: number;
      status: string;
      synced_at: string;
    }>;

  return rows.map(r => ({
    id: r.id,
    sourceSystem: r.source_system,
    watermark: r.watermark,
    recordsSynced: r.records_synced,
    status: r.status,
    syncedAt: r.synced_at,
  }));
}
