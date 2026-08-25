'use client';

import React from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  Radio, 
  Activity, 
  ShieldCheck,
  Globe
} from 'lucide-react';

export const DataIngestionPanel: React.FC = () => {
  const feeds = [
    {
      name: 'Track Management System (TMS)',
      dept: 'Civil Engineering',
      type: 'Defects, Track Geometry, IMR Rail Flaws',
      status: 'ACTIVE',
      lastSync: '2 mins ago',
      records: '1,420 Active Defects',
      latency: '12ms',
    },
    {
      name: 'Signalling Maintenance System (SMMS)',
      dept: 'S&T Department',
      type: 'Point Machines, Axle Counters, Interlocking',
      status: 'ACTIVE',
      lastSync: '1 min ago',
      records: '890 Signalling Assets',
      latency: '18ms',
    },
    {
      name: 'Traction Distribution System (TDMS)',
      dept: 'TRD (Electrical)',
      type: '25kV OHE Wires, Cantilevers, Substation Isolators',
      status: 'ACTIVE',
      lastSync: 'Just now',
      records: '640 OHE Spans',
      latency: '15ms',
    },
    {
      name: 'Control Office Application (COA)',
      dept: 'Traffic Operating',
      type: 'Passenger Timetable, Goods Train Forecast, Speed Limits',
      status: 'ACTIVE',
      lastSync: '30 secs ago',
      records: '240 Trains Active',
      latency: '8ms',
    },
    {
      name: 'Block Demand Management System (BDMS)',
      dept: 'Division Control',
      type: 'Block Requests, Disconnection Approvals & Slots',
      status: 'ACTIVE',
      lastSync: '3 mins ago',
      records: '45 Approved Blocks',
      latency: '22ms',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Enterprise Systems Integration & Data Ingestion Bus
          </h2>
          <p className="text-xs text-slate-400">
            Real-time API sync between Indian Railways core databases (TMS, SMMS, TDMS, COA, BDMS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            5 Systems Connected (Zero Failure)
          </span>
        </div>
      </div>

      {/* Feed List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feeds.map(feed => (
          <div
            key={feed.name}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all text-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">{feed.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                ONLINE
              </span>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold mb-2">{feed.dept}</div>
            <p className="text-[11px] text-slate-400 mb-3">{feed.type}</p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              <div>
                Records: <span className="text-slate-200 font-semibold">{feed.records}</span>
              </div>
              <div>
                Latency: <span className="text-emerald-400 font-semibold">{feed.latency}</span>
              </div>
              <div>
                Last Sync: <span className="text-slate-300">{feed.lastSync}</span>
              </div>
              <div>
                Bus Protocol: <span className="text-cyan-400 font-mono">REST/gRPC</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
