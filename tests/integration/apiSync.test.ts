import { describe, it, expect } from 'vitest';
import { syncSource, syncAllSources, getSyncLogs } from '@/app/lib/syncEngine';
import { taskStore } from '@/app/lib/taskStore';

describe('Source Sync Engine Integration', () => {
  it('synchronizes TMS defect feed and transactionally updates task store', async () => {
    const initialCount = taskStore.getAll().length;
    const result = await syncSource('TMS');

    expect(result.status).toBe('SUCCESS');
    expect(result.sourceSystem).toBe('TMS');
    expect(result.tasksInserted).toBeGreaterThan(0);

    const afterCount = taskStore.getAll().length;
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  it('records sync events into the database source_syncs audit log', async () => {
    await syncSource('SMMS');
    const logs = getSyncLogs(10);

    expect(logs.length).toBeGreaterThan(0);
    const smmsLog = logs.find(l => l.sourceSystem === 'SMMS');
    expect(smmsLog).toBeDefined();
    expect(smmsLog?.status).toBe('SUCCESS');
  });

  it('runs multi-source sync across TMS, SMMS, TDMS, and COA', async () => {
    const results = await syncAllSources();

    expect(results.length).toBe(4);
    for (const res of results) {
      expect(res.status).toBe('SUCCESS');
    }
  });
});
