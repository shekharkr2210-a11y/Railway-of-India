'use client';

import React, { useState } from 'react';
import { ZonalRailway, DivisionalUnit, ScopeLevel, UserRole } from '../lib/types';
import { 
  Globe, 
  Train, 
  Award, 
  X, 
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
      {/* Top Enterprise Banner - Executive Navy */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                MINISTRY OF RAILWAYS • RAILWAY BOARD HQ
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                Role: {userRole.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Indian Railways All-India Network Operations & Asset Performance
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              Coordinating 18 Zonal Railways • 68 Operational Divisions • 68,000+ Route Kilometers
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/20 text-center">
              <div className="text-blue-200 text-[10px] uppercase font-bold">Total Network Length</div>
              <div className="text-base font-extrabold text-white">68,155 KM</div>
            </div>
            <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/20 text-center">
              <div className="text-blue-200 text-[10px] uppercase font-bold">Zonal HQs Connected</div>
              <div className="text-base font-extrabold text-emerald-300">18 Zones</div>
            </div>
            <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/20 text-center">
              <div className="text-blue-200 text-[10px] uppercase font-bold">Divisional Units</div>
              <div className="text-base font-extrabold text-amber-300">68 Divisions</div>
            </div>
          </div>
        </div>
      </div>

      {/* 18 Zonal Railways Performance Leaderboard */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              18 Zonal Railways Performance & Asset Availability Leaderboard
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Click any Zonal Railway card to pop up detailed divisional insights & asset metrics
            </p>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>Filter Scope:</span>
            <button
              onClick={() => { setScopeLevel('NATIONAL'); onSelectZone('ALL'); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scopeLevel === 'NATIONAL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] group relative ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-md ring-1 ring-indigo-300'
                    : 'bg-gray-50/70 border-gray-200 hover:border-indigo-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center ${
                      index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      index === 1 ? 'bg-gray-200 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {zone.name} ({zone.code})
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect Zone
                  </span>
                </div>

                <div className="text-[10px] text-gray-500 font-mono mb-2">HQ: {zone.hqCity} • {zone.divisionsCount} Divisions</div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 text-xs">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Asset Uptime</div>
                    <div className="text-sm font-extrabold text-emerald-600">{zone.assetAvailabilityPercentage}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Shadow Efficiency</div>
                    <div className="text-sm font-extrabold text-indigo-600">{zone.shadowEfficiencyPercentage}%</div>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Route Length</div>
                    <div className="text-xs text-gray-800 font-mono">{zone.routeLengthKm} KM</div>
                  </div>
                  <div className="mt-1">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Active Defects</div>
                    <div className="text-xs text-amber-700 font-semibold">{zone.activeDefectsCount} Tasks</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POP-UP MODAL WINDOW FOR ZONAL RAILWAYS */}
      {modalZone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-gray-300 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative space-y-5 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {modalZone.code}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    {modalZone.name}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                      Active Zone
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Headquarters: <span className="text-gray-800 font-bold">{modalZone.hqCity}</span> • Total Route Length: <span className="text-indigo-700 font-mono font-bold">{modalZone.routeLengthKm} KM</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalZone(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Asset Availability</div>
                <div className="text-xl font-extrabold text-emerald-600">{modalZone.assetAvailabilityPercentage}%</div>
                <div className="text-[10px] text-gray-400">Corridor Uptime</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Shadow Efficiency</div>
                <div className="text-xl font-extrabold text-indigo-600">{modalZone.shadowEfficiencyPercentage}%</div>
                <div className="text-[10px] text-gray-400">Co-located Blocks</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Active Defect Queue</div>
                <div className="text-xl font-extrabold text-amber-600">{modalZone.activeDefectsCount}</div>
                <div className="text-[10px] text-gray-400">TMS/SMMS/TDMS Tasks</div>
              </div>
            </div>

            {/* Zone Divisions Breakdown */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Divisions under {modalZone.name} ({modalZone.divisionsCount} Total)</span>
                <span className="text-indigo-700 font-mono">Live Integrated</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {divisions.filter(d => d.zoneCode === modalZone.code).length > 0 ? (
                  divisions.filter(d => d.zoneCode === modalZone.code).map(d => (
                    <div key={d.code} className="p-2 rounded bg-white border border-gray-200 shadow-xs">
                      <div className="font-bold text-gray-900">{d.name}</div>
                      <div className="text-[10px] text-gray-500">{d.activeTasksCount} Active Tasks</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2 rounded bg-white border border-gray-200">
                      <div className="font-bold text-gray-900">{modalZone.code} Division 1</div>
                      <div className="text-[10px] text-gray-500">280 Active Tasks</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-200">
                      <div className="font-bold text-gray-900">{modalZone.code} Division 2</div>
                      <div className="text-[10px] text-gray-500">310 Active Tasks</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-200">
                      <div className="font-bold text-gray-900">{modalZone.code} Division 3</div>
                      <div className="text-[10px] text-gray-500 font-mono">HQ: {modalZone.hqCity}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => setModalZone(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Close Window
              </button>
              <button
                onClick={() => handleApplyZoneFilter(modalZone.code)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md shadow-indigo-500/20"
              >
                Filter Dashboard to {modalZone.code}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Golden Quadrilateral Cross-Zonal Corridor Monitor */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
        <div className="mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Train className="w-5 h-5 text-indigo-600" />
            Golden Quadrilateral & High-Density Cross-Zonal Corridors
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-Zone maintenance synchronization preventing inter-zonal passenger & freight delays
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-gray-900 text-sm">
              <span>Delhi - Mumbai Golden Corridor</span>
              <span className="text-indigo-700 font-mono text-xs">1,386 KM (NR / WCR / WR)</span>
            </div>
            <p className="text-gray-600 text-[11px]">
              Connects Delhi Division (NR) to Vadodara & Mumbai Central Divisions (WR). Cross-zonal shadow blocking prevents Rajdhani & Container freight bottlenecks.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                ✨ 14 Cross-Zonal Shadow Windows
              </span>
              <span className="text-gray-600">98.5% Availability Uptime</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-gray-900 text-sm">
              <span>Delhi - Howrah Main Line</span>
              <span className="text-indigo-700 font-mono text-xs">1,447 KM (NR / NCR / ECR / ER)</span>
            </div>
            <p className="text-gray-600 text-[11px]">
              Traverses Delhi (NR), Prayagraj (NCR), Pt. Deen Dayal Upadhyaya (ECR), and Howrah (ER). High-density coal & passenger corridor.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                ✨ 18 Cross-Zonal Shadow Windows
              </span>
              <span className="text-gray-600">98.8% Availability Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
