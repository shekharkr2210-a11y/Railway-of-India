import { SourceAdapter, SupportedSource } from './types';
import { tmsAdapter } from './tmsAdapter';
import { smmsAdapter } from './smmsAdapter';
import { tdmsAdapter } from './tdmsAdapter';
import { coaAdapter } from './coaAdapter';

export * from './types';
export { tmsAdapter, smmsAdapter, tdmsAdapter, coaAdapter };

export const SOURCE_ADAPTERS: Record<SupportedSource, SourceAdapter> = {
  TMS: tmsAdapter,
  SMMS: smmsAdapter,
  TDMS: tdmsAdapter,
  COA: coaAdapter,
  BDMS: {
    sourceSystem: 'BDMS',
    name: 'Block Demand Management System (BDMS)',
    description: 'Interface for block demand requests and digital sanctions',
    async fetchUpdates() {
      return { watermark: `BDMS-${Date.now()}`, tasks: [] };
    },
    mapToCanonicalTask(raw) {
      return tmsAdapter.mapToCanonicalTask(raw);
    },
  },
};

export function getSourceAdapter(source: SupportedSource): SourceAdapter {
  const adapter = SOURCE_ADAPTERS[source];
  if (!adapter) {
    throw new Error(`Unsupported source adapter: ${source}`);
  }
  return adapter;
}
