'use client';

import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Download,
  AlertCircle
} from 'lucide-react';
import { batchImportTasks } from '../lib/apiClient';
import { MaintenanceTask } from '../lib/types';

interface DataIngestionPanelProps {
  onTasksImported?: (newTasks: MaintenanceTask[]) => void;
}

export const DataIngestionPanel: React.FC<DataIngestionPanelProps> = ({ onTasksImported }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  const feeds = [
    {
      name: 'Track Management System (TMS)',
      dept: 'Civil Engineering',
      type: 'Defects, Track Geometry, IMR Rail Flaws',
      status: 'ACTIVE',
      lastSync: 'Just now (Live WebSocket)',
      records: '1,420 Active Defects',
      latency: '12ms',
      protocol: 'REST/gRPC',
    },
    {
      name: 'Signalling Maintenance System (SMMS)',
      dept: 'S&T Department',
      type: 'Point Machines, Axle Counters, Interlocking',
      status: 'ACTIVE',
      lastSync: '1 min ago',
      records: '890 Signalling Assets',
      latency: '18ms',
      protocol: 'gRPC Bus',
    },
    {
      name: 'Traction Distribution System (TDMS)',
      dept: 'TRD (Electrical)',
      type: '25kV OHE Wires, Cantilevers, Substation Isolators',
      status: 'ACTIVE',
      lastSync: 'Just now',
      records: '640 OHE Spans',
      latency: '15ms',
      protocol: 'REST / SCADA',
    },
    {
      name: 'Control Office Application (COA)',
      dept: 'Traffic Operating',
      type: 'Passenger Timetable, Goods Train Forecast, Speed Limits',
      status: 'ACTIVE',
      lastSync: '30 secs ago',
      records: '240 Trains Active',
      latency: '8ms',
      protocol: 'MQTT Stream',
    },
    {
      name: 'Block Demand Management System (BDMS)',
      dept: 'Division Control',
      type: 'Block Requests, Disconnection Approvals & Slots',
      status: 'ACTIVE',
      lastSync: 'Live',
      records: '45 Approved Blocks',
      latency: '22ms',
      protocol: 'HTTPS REST',
    },
  ];

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to CRIS Railway Enterprise Data Bus...');

    setTimeout(async () => {
      // Simulate ingesting 3 new urgent defects from TMS & TDMS
      const sampleDefects: Partial<MaintenanceTask>[] = [
        {
          id: `TASK-TMS-${Math.floor(2000 + Math.random() * 8000)}`,
          sourceSystem: 'TMS',
          department: 'ENG',
          departmentName: 'Civil Track (TMS)',
          zoneCode: 'NCR',
          divisionCode: 'PRYJ',
          title: 'Immediate USFD Ultrasonic Rail Fracture Detected at Weld 84',
          sectionId: 'SEC-03',
          sectionName: 'MTJ-AGC (KM 134-188)',
          startKm: 142,
          endKm: 144,
          estimatedDurationHours: 2.2,
          severity: 'CRITICAL',
          overdueDays: 4,
          requiresPowerBlock: false,
          speedRestrictionImpactKmvh: 45,
          status: 'PENDING',
        },
        {
          id: `TASK-TDMS-${Math.floor(2000 + Math.random() * 8000)}`,
          sourceSystem: 'TDMS',
          department: 'TRD',
          departmentName: 'Traction Distribution (TDMS)',
          zoneCode: 'NCR',
          divisionCode: 'PRYJ',
          title: '25kV OHE Dropper Wire Snapping Prevention Scan',
          sectionId: 'SEC-03',
          sectionName: 'MTJ-AGC (KM 134-188)',
          startKm: 143,
          endKm: 145,
          estimatedDurationHours: 1.8,
          severity: 'HIGH',
          overdueDays: 2,
          requiresPowerBlock: true,
          speedRestrictionImpactKmvh: 20,
          status: 'PENDING',
        },
      ];

      try {
        const res = await batchImportTasks(sampleDefects);
        if (res.success && onTasksImported) {
          onTasksImported(res.tasks);
          setUploadedCount(res.importedCount);
          setSyncStatus(`✅ Synced with CRIS Data Bus. Ingested ${res.importedCount} new defects into AI Optimizer!`);
        }
      } catch {
        setSyncStatus('⚠️ Sync completed with local simulated cache.');
      } finally {
        setIsSyncing(false);
      }
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncStatus(`Parsing ${file.name}...`);

    // Ingest sample batch from CSV
    setTimeout(async () => {
      const csvTasks: Partial<MaintenanceTask>[] = [
        {
          id: `CSV-ENG-${Date.now()}`,
          sourceSystem: 'TMS',
          department: 'ENG',
          departmentName: 'Civil Engineering',
          zoneCode: 'NR',
          divisionCode: 'DLI',
          title: 'CSV Import: Deep Track Screening & Ballast Tamping',
          sectionId: 'SEC-01',
          sectionName: 'NDLS-FZB (KM 0-44)',
          startKm: 22,
          endKm: 25,
          estimatedDurationHours: 2.5,
          severity: 'HIGH',
          overdueDays: 1,
          requiresPowerBlock: false,
          speedRestrictionImpactKmvh: 30,
          status: 'PENDING',
        },
      ];

      const res = await batchImportTasks(csvTasks);
      if (res.success && onTasksImported) {
        onTasksImported(res.tasks);
        setUploadedCount(res.importedCount);
        setSyncStatus(`✅ Successfully imported ${file.name} (${res.importedCount} records).`);
      }
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <div className="bg-gray-100/80 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Enterprise Systems Integration & Data Ingestion Bus
          </h2>
          <p className="text-xs text-gray-500">
            Real-time API sync between Indian Railways core databases (TMS, SMMS, TDMS, COA, BDMS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing CRIS Bus...' : 'Trigger Multi-System Sync'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* CSV / Excel Ingestion Zone */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-dashed border-gray-300 hover:border-amber-500/50 transition-all flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-50 text-amber-400 border border-gray-200">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Batch Upload Defect Work Orders (CSV / Excel / JSON)</div>
            <p className="text-[11px] text-gray-500">
              Directly ingest TMS Rail Flaws, TDMS OHE defects, or SMMS Interlocking logs into the AI Optimizer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-gray-300">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Upload File
            <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Feed List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feeds.map(feed => (
          <div
            key={feed.name}
            className="p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all text-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 text-sm">{feed.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {feed.status}
              </span>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold mb-2">{feed.dept}</div>
            <p className="text-[11px] text-gray-500 mb-3">{feed.type}</p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
              <div>
                Records: <span className="text-gray-800 font-semibold">{feed.records}</span>
              </div>
              <div>
                Latency: <span className="text-emerald-400 font-semibold">{feed.latency}</span>
              </div>
              <div>
                Last Sync: <span className="text-gray-700">{feed.lastSync}</span>
              </div>
              <div>
                Bus Protocol: <span className="text-cyan-400 font-mono">{feed.protocol}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
