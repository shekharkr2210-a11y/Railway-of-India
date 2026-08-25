'use client';

import React, { useState } from 'react';
import { ZonalRailway, DivisionalUnit, ScopeLevel, UserRole } from '../lib/types';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Train, 
  Award,
  ChevronRight,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface NationalOverviewProps {
  zones: ZonalRailway[];
  divisions: DivisionalUnit[];
  selectedZone: string;
  onSelectZone: (zoneCode: string) => void;
  scopeLevel: ScopeLevel;
  setScopeLevel: (scope: ScopeLevel) => void;
  userRole: UserRole;
}

export const NationalOverview: React.FC<NationalOverviewProps> = ({
  zones,
  divisions,
  selectedZone,
  onSelectZone,
  scopeLevel,
  setScopeLevel,
  userRole,
}) => {
  const [modalZone, setModalZone] = useState<ZonalRailway | null>(null);

  const sortedZones = [...zones].sort((a, b) => b.assetAvailabilityPercentage - a.assetAvailabilityPercentage);

  const handleZoneClick = (zone: ZonalRailway) => {
    setModalZone(zone);
  };

  const handleApplyZoneFilter = (zoneCode: string) => {
    onSelectZone(zoneCode);
    setScopeLevel('ZONE');
    setModalZone(null);
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Top Enterprise Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                MINISTRY OF RAILWAYS • RAILWAY BOARD HQ
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                Role: {userRole.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Indian Railways All-India Network Operations & Asset Performance
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Coordinating 18 Zonal Railways • 68 Operational Divisions • 68,000+ Route Kilometers
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Total Network Length</div>
              <div className="text-base font-extrabold text-white">68,155 KM</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Zonal HQs Connected</div>
              <div className="text-base font-extrabold text-emerald-400">18 Zones</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Divisional Units</div>
              <div className="text-base font-extrabold text-amber-400">68 Divisions</div>
            </div>
          </div>
        </div>
      </div>

      {/* 18 Zonal Railways Performance Leaderboard */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              18 Zonal Railways Performance & Asset Availability Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Click any Zonal Railway card to pop up detailed divisional insights & asset metrics
            </p>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Filter Scope:</span>
            <button
              onClick={() => { setScopeLevel('NATIONAL'); onSelectZone('ALL'); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scopeLevel === 'NATIONAL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All India (National)
            </button>
          </div>
        </div>

        {/* Zones Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedZones.map((zone, index) => {
            const isSelected = selectedZone === zone.code;

            return (
              <div
                key={zone.code}
                onClick={() => handleZoneClick(zone)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:z-10 group relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center ${
                      index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      index === 1 ? 'bg-slate-700 text-slate-200' :
                      index === 2 ? 'bg-amber-700/30 text-amber-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {zone.name} ({zone.code})
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to Open Popup
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono mb-2">HQ: {zone.hqCity} • {zone.divisionsCount} Divisions</div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Asset Uptime</div>
                    <div className="text-sm font-extrabold text-emerald-400">{zone.assetAvailabilityPercentage}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Shadow Efficiency</div>
                    <div className="text-sm font-extrabold text-cyan-400">{zone.shadowEfficiencyPercentage}%</div>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Route Length</div>
                    <div className="text-xs text-slate-300 font-mono">{zone.routeLengthKm} KM</div>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Defects</div>
                    <div className="text-xs text-amber-400 font-semibold">{zone.activeDefectsCount} Tasks</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POP-UP MODAL WINDOW FOR ZONAL RAILWAYS */}
      {modalZone && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative space-y-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xl">
                  {modalZone.code}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    {modalZone.name}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Zone
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Headquarters: <span className="text-slate-200 font-bold">{modalZone.hqCity}</span> • Total Route Length: <span className="text-amber-400 font-mono font-bold">{modalZone.routeLengthKm} KM</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalZone(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Asset Availability</div>
                <div className="text-xl font-extrabold text-emerald-400">{modalZone.assetAvailabilityPercentage}%</div>
                <div className="text-[10px] text-slate-500">Corridor Uptime</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Shadow Efficiency</div>
                <div className="text-xl font-extrabold text-cyan-400">{modalZone.shadowEfficiencyPercentage}%</div>
                <div className="text-[10px] text-slate-500">Co-located Blocks</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Active Defect Queue</div>
                <div className="text-xl font-extrabold text-amber-400">{modalZone.activeDefectsCount}</div>
                <div className="text-[10px] text-slate-500">TMS/SMMS/TDMS Tasks</div>
              </div>
            </div>

            {/* Zone Divisions Breakdown */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Divisions under {modalZone.name} ({modalZone.divisionsCount} Total)</span>
                <span className="text-amber-400 font-mono">Live Integrated</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {divisions.filter(d => d.zoneCode === modalZone.code).length > 0 ? (
                  divisions.filter(d => d.zoneCode === modalZone.code).map(d => (
                    <div key={d.code} className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400">{d.activeTasksCount} Active Tasks</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{modalZone.code} Division 1</div>
                      <div className="text-[10px] text-slate-400">280 Active Tasks</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{modalZone.code} Division 2</div>
                      <div className="text-[10px] text-slate-400">310 Active Tasks</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">{modalZone.code} Division 3</div>
                      <div className="text-[10px] text-slate-400 font-mono">HQ: {modalZone.hqCity}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setModalZone(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close Window
              </button>
              <button
                onClick={() => handleApplyZoneFilter(modalZone.code)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                Filter Dashboard to {modalZone.code}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Golden Quadrilateral Cross-Zonal Corridor Monitor */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-cyan-400" />
            Golden Quadrilateral & High-Density Cross-Zonal Corridors
          </h3>
          <p className="text-xs text-slate-400">
            Multi-Zone maintenance synchronization preventing inter-zonal passenger & freight delays
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-white text-sm">
              <span>Delhi - Mumbai Golden Corridor</span>
              <span className="text-emerald-400 font-mono text-xs">1,386 KM (NR / WCR / WR)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Connects Delhi Division (NR) to Vadodara & Mumbai Central Divisions (WR). Cross-zonal shadow blocking prevents Rajdhani & Container freight bottlenecks.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                ✨ 14 Cross-Zonal Shadow Windows
              </span>
              <span className="text-slate-400">98.5% Availability Uptime</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-white text-sm">
              <span>Delhi - Howrah Main Line</span>
              <span className="text-emerald-400 font-mono text-xs">1,447 KM (NR / NCR / ECR / ER)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Traverses Delhi (NR), Prayagraj (NCR), Pt. Deen Dayal Upadhyaya (ECR), and Howrah (ER). High-density coal & passenger corridor.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                ✨ 18 Cross-Zonal Shadow Windows
              </span>
              <span className="text-slate-400">98.8% Availability Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
