'use client';

import React from 'react';
import { ZonalRailway, DivisionalUnit, MaintenanceTask, ScopeLevel } from '../lib/types';
import { 
  X, 
  Building2, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  MapPin,
  Train,
  Award,
  Layers,
  FileText
} from 'lucide-react';

interface ZoneDetailModalProps {
  zone: ZonalRailway | null;
  divisions: DivisionalUnit[];
  tasks: MaintenanceTask[];
  onClose: () => void;
  onFilterToZone: (zoneCode: string) => void;
  onRunZoneOptimizer: (zoneCode: string) => void;
}

export const ZoneDetailModal: React.FC<ZoneDetailModalProps> = ({
  zone,
  divisions,
  tasks,
  onClose,
  onFilterToZone,
  onRunZoneOptimizer,
}) => {
  if (!zone) return null;

  const zoneDivisions = divisions.filter(d => d.zoneCode === zone.code);
  const zoneTasks = tasks.filter(t => t.zoneCode === zone.code);
  const criticalCount = zoneTasks.filter(t => t.severity === 'CRITICAL').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-extrabold text-xl">
              {zone.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {zone.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Zone
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-400" /> HQ: {zone.hqCity}</span>
                <span>• Route Length: <strong className="text-slate-200">{zone.routeLengthKm} KM</strong></span>
                <span>• Divisions: <strong className="text-amber-400">{zone.divisionsCount} Units</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable Body */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-1 relative z-10">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Asset Availability Uptime</div>
              <div className="text-2xl font-extrabold text-emerald-400">{zone.assetAvailabilityPercentage}%</div>
              <p className="text-[10px] text-slate-500 mt-1">+3.2% vs manual baseline</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Shadow Block Efficiency</div>
              <div className="text-2xl font-extrabold text-cyan-400">{zone.shadowEfficiencyPercentage}%</div>
              <p className="text-[10px] text-slate-500 mt-1">Multi-dept co-location rate</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Active Defect Queue</div>
              <div className="text-2xl font-extrabold text-white">{zone.activeDefectsCount}</div>
              <p className="text-[10px] text-red-400 font-semibold mt-1">{criticalCount} Critical Flaws</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Route Network</div>
              <div className="text-2xl font-extrabold text-amber-400">{zone.routeLengthKm} KM</div>
              <p className="text-[10px] text-slate-500 mt-1">{zone.divisionsCount} Divisions Integrated</p>
            </div>
          </div>

          {/* Divisions under this Zone */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Divisions Under {zone.name} ({zone.code})
            </h3>
            {zoneDivisions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {zoneDivisions.map(div => (
                  <div key={div.code} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-bold text-white mb-1">{div.name} ({div.code})</div>
                    <div className="text-[11px] text-slate-400">HQ: {div.headquarters}</div>
                    <div className="text-[10px] text-amber-400 font-semibold mt-1">{div.activeTasksCount} Active Tasks</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Divisions: Lucknow (LJN), Varanasi (BSB), Izatnagar (IZN) fully integrated under {zone.name}.
              </p>
            )}
          </div>

          {/* Active Maintenance Tasks in this Zone */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Active TMS, SMMS & TDMS Defect Tasks in {zone.code} ({zoneTasks.length})
            </h3>
            {zoneTasks.length > 0 ? (
              <div className="space-y-2">
                {zoneTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.department === 'ENG' ? 'bg-blue-500/20 text-blue-300' :
                          task.department === 'TRD' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {task.sourceSystem} ({task.department})
                        </span>
                        <span className="font-bold text-white">{task.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Section: {task.sectionName} • KM {task.startKm}-{task.endKm} • Est: {task.estimatedDurationHours}h
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      TCI: {task.criticalityScore}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                All high-priority track and signaling tasks in {zone.name} are currently scheduled into active Shadow Blocks.
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-slate-400">
            Clicking <span className="text-amber-400 font-semibold">Filter All Views to This Zone</span> focuses all Gantt, Corridor & Task queues on {zone.code}.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onRunZoneOptimizer(zone.code);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Run AI Optimizer for {zone.code}
            </button>

            <button
              onClick={() => {
                onFilterToZone(zone.code);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
            >
              Filter All Views to {zone.name}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
