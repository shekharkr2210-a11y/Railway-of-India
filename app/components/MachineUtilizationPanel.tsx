'use client';

import React, { useState, useMemo } from 'react';
import { BlockWindow, MaintenanceTask } from '../lib/types';
import { calculateFleetUtilization } from '../lib/fleetAnalytics';
import { rosterCrewsForBlocks } from '../lib/crewRosterEngine';
import { calculateTSRDelaySavings } from '../lib/tsrEngine';
import { 
  Truck, 
  Users, 
  Gauge, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Zap,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';

interface MachineUtilizationPanelProps {
  blocks: BlockWindow[];
  tasks: MaintenanceTask[];
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export function MachineUtilizationPanel({ blocks, tasks, horizon }: MachineUtilizationPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'MACHINERY' | 'CREW_ROSTER' | 'TSR_SPEED'>('MACHINERY');

  const horizonDays = horizon === 'DAILY' ? 1 : horizon === 'WEEKLY' ? 7 : 30;

  const fleetStats = useMemo(() => {
    return calculateFleetUtilization(blocks, horizonDays);
  }, [blocks, horizonDays]);

  const crewAssignments = useMemo(() => {
    return rosterCrewsForBlocks(blocks);
  }, [blocks]);

  const tsrSavings = useMemo(() => {
    return calculateTSRDelaySavings(tasks);
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Sub-Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            Track Machine Fleet & Crew Operations Center
          </h2>
          <p className="text-sm text-slate-400">
            Real-time telemetry for Heavy Track Machinery (BCM/CSM/TW), HOER Gang Rosters, and TSR Speed Recovery
          </p>
        </div>

        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveSubTab('MACHINERY')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'MACHINERY'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            Machine Fleet ({fleetStats.fleet.length})
          </button>
          <button
            onClick={() => setActiveSubTab('CREW_ROSTER')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'CREW_ROSTER'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            HOER Crew Roster ({crewAssignments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TSR_SPEED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'TSR_SPEED'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            TSR Speed Recovery
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Fleet Utilization Rate</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{fleetStats.overallUtilizationPercentage}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 12 mechanized units</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Machine Working Hrs</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{fleetStats.totalFleetOperatingHours} hrs</div>
          <div className="text-[11px] text-slate-500 mt-1">Active corridor possession time</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>HOER Compliance Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">100%</div>
          <div className="text-[11px] text-slate-500 mt-1">12h statutory night rest guarded</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Daily Delay Mins Saved (TSR)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{tsrSavings.totalDelayMinutesSavedDaily} min</div>
          <div className="text-[11px] text-slate-500 mt-1">{tsrSavings.totalPassengerDelaySavedMinutes} min passenger express</div>
        </div>
      </div>

      {/* Sub-Tab 1: Machinery Fleet View */}
      {activeSubTab === 'MACHINERY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleetStats.fleet.map((machine) => {
            const isHighUtil = machine.utilizationRatePercentage >= 60;
            const isMidUtil = machine.utilizationRatePercentage >= 30;

            return (
              <div 
                key={machine.machineCode}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400">{machine.machineCode}</div>
                      <div className="text-sm font-semibold text-white">{machine.machineName}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isHighUtil 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : isMidUtil 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {machine.utilizationRatePercentage}% Utilized
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighUtil ? 'bg-emerald-500' : isMidUtil ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.max(5, machine.utilizationRatePercentage)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mb-3">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Operating Hours</span>
                      <span className="font-bold text-cyan-300">{machine.totalWorkingHours} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Transit Movement</span>
                      <span className="font-bold text-amber-300">~{machine.transitKm} km</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1 font-medium">Assigned Corridors:</div>
                  <div className="flex flex-wrap gap-1">
                    {machine.assignedCorridors.length > 0 ? (
                      machine.assignedCorridors.map((c) => (
                        <span key={c} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Depot Standby / Routine Maintenance</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Tab 2: HOER Crew Rostering View */}
      {activeSubTab === 'CREW_ROSTER' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Statutory Gang Roster & Shift Allocation (Indian Railways HOER Norms)
            </h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Statutory Rest Enforced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Gang ID & Unit</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Block</th>
                  <th className="py-3 px-4">Shift Timing</th>
                  <th className="py-3 px-4">Night Shift</th>
                  <th className="py-3 px-4">Statutory Rest Until</th>
                  <th className="py-3 px-4">HOER Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {crewAssignments.map((crew, idx) => (
                  <tr key={`${crew.gangId}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="font-mono text-cyan-400 text-[11px]">{crew.gangId}</div>
                      <div>{crew.crewName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        crew.department === 'ENG' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : crew.department === 'TRD' 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {crew.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{crew.assignedBlockId}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {crew.shiftDate} ({crew.shiftStart} - {crew.shiftEnd})
                    </td>
                    <td className="py-3 px-4">
                      {crew.isNightShift ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> Yes (22:00-06:00)
                        </span>
                      ) : (
                        <span className="text-slate-400">Day Shift</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      {crew.restUntil} (12h Guard)
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> HOER COMPLIANT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: TSR Speed Recovery View */}
      {activeSubTab === 'TSR_SPEED' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Temporary Speed Restriction (TSR) Speed Relaxation Curve
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Indian Railways Permanent Way Manual (IRPWM) 3-Stage Consolidation Protocol following heavy mechanized work
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Daily Punctuality Savings</div>
              <div className="text-lg font-bold text-emerald-400">{tsrSavings.totalDelayMinutesSavedDaily} minutes/day</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">Stage 1: Day 1 Post-Block</span>
                <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">30 km/h</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Immediate initial consolidation following BCM ballast cleaning or rail renewal.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• Delay Impact: <span className="text-amber-300 font-semibold">+6.5 min / 2km</span></div>
                <div>• Dynamic Track Stabilizer pass completed</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400">Stage 2: Day 2 Post-Block</span>
                <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">75 km/h</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Intermediate consolidation after 1st tamping pass (CSM-10) and alignment verification.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• Delay Impact: <span className="text-cyan-300 font-semibold">+2.2 min / 2km</span></div>
                <div>• Track geometry recording car clearance</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400">Stage 3: Day 3+ Full Restoration</span>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">130 km/h</span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Final tamping and permanent speed relaxation to normal sectional maximum speed.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>• Delay Impact: <span className="text-emerald-300 font-semibold">0.0 min (Full Speed)</span></div>
                <div>• Caution order lifted by Assistant Divisional Engineer (AEN)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
