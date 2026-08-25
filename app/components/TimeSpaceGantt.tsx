'use client';

import React, { useState } from 'react';
import { CorridorSection, BlockWindow, TrainMovement, MaintenanceTask } from '../lib/types';
import { 
  Clock, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  Info
} from 'lucide-react';

interface TimeSpaceGanttProps {
  sections: CorridorSection[];
  blocks: BlockWindow[];
  trains: TrainMovement[];
  tasks: MaintenanceTask[];
  horizon?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export const TimeSpaceGantt: React.FC<TimeSpaceGanttProps> = ({
  sections,
  blocks,
  trains,
  tasks,
  horizon = 'WEEKLY',
}) => {
  const [selectedBlock, setSelectedBlock] = useState<BlockWindow | null>(null);
  const [viewMode, setViewMode] = useState<'HOURLY' | 'WEEKLY_ROLLUP' | 'MONTHLY_CALENDAR'>('HOURLY');

  // Convert "HH:mm" to hour float (e.g. "11:30" -> 11.5)
  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const hours = Array.from({ length: 25 }, (_, i) => i);
  const weekDays = ['Monday (Day 1)', 'Tuesday (Day 2)', 'Wednesday (Day 3)', 'Thursday (Day 4)', 'Friday (Day 5)', 'Saturday (Day 6)', 'Sunday (Day 7)'];

  return (
    <div className="bg-gray-100/80 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl overflow-hidden">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              AI Time-Space Multi-Track Gantt Planner
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Horizon: {horizon}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Coordinated Corridor Schedule • Timetable Headway Constraints (Trains) & AI Shadow Blocks (Maintenance)
          </p>
        </div>

        {/* View Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('HOURLY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'HOURLY' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              24h Time-Space
            </button>
            <button
              onClick={() => setViewMode('WEEKLY_ROLLUP')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'WEEKLY_ROLLUP' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => setViewMode('MONTHLY_CALENDAR')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'MONTHLY_CALENDAR' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              30-Day Cyclical
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs bg-white/60 px-3 py-1.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400"></span>
              <span className="text-gray-700 font-medium">✨ Shadow Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 border border-blue-400"></span>
              <span className="text-gray-700 font-medium">Single Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400"></span>
              <span className="text-gray-700 font-medium">Passenger Express</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400"></span>
              <span className="text-gray-700 font-medium">Freight Rake</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: 24-Hour Time-Space Diagram */}
      {viewMode === 'HOURLY' && (
        <div className="relative overflow-x-auto bg-white border border-gray-200 rounded-xl p-4">
          <div className="min-w-[950px]">
            {/* Time Header (X-Axis: 00:00 to 24:00) */}
            <div className="grid grid-cols-[180px_1fr] border-b border-gray-200 pb-2 mb-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Corridor Section
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-500">
                {hours.map(h => (
                  <span key={h} className="w-6 text-center">
                    {h.toString().padStart(2, '0')}h
                  </span>
                ))}
              </div>
            </div>

            {/* Section Rows (Y-Axis) */}
            <div className="space-y-4 relative pt-2">
              {sections.map(section => {
                const sectionBlocks = blocks.filter(b => b.sectionId === section.id);
                const sectionTrains = trains.filter(t => t.sectionId === section.id);

                return (
                  <div
                    key={section.id}
                    className="grid grid-cols-[180px_1fr] items-center border-b border-gray-200/60 pb-4 relative group"
                  >
                    {/* Section Label */}
                    <div className="pr-3">
                      <div className="text-xs font-bold text-gray-900 group-hover:text-amber-400 transition-colors">
                        {section.code}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {section.startKm}-{section.endKm} KM ({section.tracks} tracks)
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Headway Clear
                      </div>
                    </div>

                    {/* Time Grid Row Canvas */}
                    <div className="relative h-16 bg-gray-100/50 rounded-lg border border-gray-200/80 overflow-hidden">
                      {/* Hourly Vertical Grid Lines */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none">
                        {hours.map(h => (
                          <div key={h} className="h-full border-r border-gray-200/40"></div>
                        ))}
                      </div>

                      {/* Block Windows Rendering */}
                      {sectionBlocks.map(block => {
                        const startH = parseHour(block.startTime);
                        const endH = parseHour(block.endTime);
                        const leftPct = (startH / 24) * 100;
                        const widthPct = Math.max(4, ((endH - startH) / 24) * 100);

                        return (
                          <div
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:z-20 p-1.5 flex flex-col justify-between shadow-md ${
                              block.isShadowBlock
                                ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border border-emerald-400 text-gray-900 shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-blue-400 text-gray-900 shadow-blue-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="truncate flex items-center gap-1">
                                {block.isShadowBlock && <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />}
                                {block.startTime}-{block.endTime}
                              </span>
                              <span className="bg-white/70 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                {block.durationHours}h
                              </span>
                            </div>
                            <div className="text-[9px] font-semibold tracking-tight truncate opacity-90">
                              {block.participatingDepartments.join(' + ')}
                            </div>
                          </div>
                        );
                      })}

                      {/* Train Paths Rendering (Vector overlays) */}
                      {sectionTrains.map(train => {
                        const entryH = parseHour(train.entryTime);
                        const exitH = parseHour(train.exitTime);
                        const leftPct = (entryH / 24) * 100;
                        const widthPct = Math.max(3, ((exitH - entryH) / 24) * 100);

                        return (
                          <div
                            key={train.id}
                            title={`${train.trainNumber} - ${train.trainName} (${train.entryTime} to ${train.exitTime})`}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className="absolute top-1/2 -translate-y-1/2 h-1 pointer-events-auto cursor-pointer group/train z-10"
                          >
                            <div
                              className={`h-full rounded-full transition-all group-hover/train:h-2.5 ${
                                train.type === 'PASSENGER_EXPRESS'
                                  ? 'bg-amber-400 shadow-sm shadow-amber-400/60'
                                  : 'bg-cyan-400 shadow-sm shadow-cyan-400/60'
                              }`}
                            ></div>
                            <span className="absolute -top-6 left-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-50 border border-gray-300 text-gray-800 hidden group-hover/train:block whitespace-nowrap z-30 shadow-lg">
                              🚆 {train.trainNumber} ({train.trainName})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 7-Day Weekly Rollup */}
      {viewMode === 'WEEKLY_ROLLUP' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((dayName, dayIdx) => {
              const dayBlocks = blocks.filter((_, idx) => (idx % 7) === dayIdx);
              const dayTasks = tasks.filter((_, idx) => (idx % 7) === dayIdx);

              return (
                <div key={dayName} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="text-xs font-bold text-amber-400 border-b border-gray-200 pb-2 mb-2 flex items-center justify-between">
                      <span>{dayName.split(' ')[0]}</span>
                      <span className="text-[10px] text-gray-500 font-mono">D{dayIdx + 1}</span>
                    </div>

                    <div className="space-y-2">
                      {dayBlocks.length === 0 ? (
                        <div className="text-[11px] text-gray-400 italic py-4 text-center">
                          Buffer Window (Freights Open)
                        </div>
                      ) : (
                        dayBlocks.map(block => (
                          <div
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            className="p-2 rounded-lg bg-white border border-gray-200 hover:border-amber-500/40 cursor-pointer text-[10px] transition-all"
                          >
                            <div className="flex items-center justify-between font-bold text-gray-900">
                              <span>{block.sectionName.split(' ')[0]}</span>
                              <span className="text-emerald-400 font-mono">+{block.downtimeSavedHours}h</span>
                            </div>
                            <div className="text-gray-500 mt-1">
                              {block.startTime} - {block.endTime} ({block.durationHours}h)
                            </div>
                            <div className="text-amber-300/80 font-semibold mt-0.5">
                              {block.participatingDepartments.join(' + ')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/80 text-[10px] text-gray-500 flex items-center justify-between">
                    <span>{dayBlocks.length} Blocks</span>
                    <span className="text-cyan-400 font-semibold">{dayTasks.length} Tasks Fixed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: 30-Day Cyclical Monthly Calendar */}
      {viewMode === 'MONTHLY_CALENDAR' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {['Week 1 (IMR Defect Backlog Clearance)', 'Week 2 (25kV OHE & Traction Overhaul)', 'Week 3 (S&T Interlocking & Axle Counter Scan)', 'Week 4 (Deep Screening & Geometry Tamping)'].map((wk, idx) => (
              <div key={wk} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs font-bold text-gray-900 mb-1">Week {idx + 1} Strategic Focus</div>
                <p className="text-[11px] text-gray-500 mb-3">{wk.split('(')[1].replace(')', '')}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700">
                  <div className="bg-white p-2 rounded border border-gray-200">
                    Target Availability: <span className="text-emerald-400 font-bold">98.6%</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    Shadow Slots: <span className="text-amber-400 font-bold">{4 + idx * 2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-100/50 rounded-lg border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Monthly cyclical planner synchronizes Civil OMS-2000 track recordings with TRD Tower Wagon runs to prevent redundant line possessions.</span>
          </div>
        </div>
      )}

      {/* Selected Block Info Card */}
      {selectedBlock && (
        <div className="mt-4 p-4 rounded-xl bg-white border border-amber-500/40 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-sm">
                  Block Window: {selectedBlock.id} ({selectedBlock.sectionName})
                </h4>
                {selectedBlock.isShadowBlock && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Multi-Department Shadow Block
                  </span>
                )}
                {selectedBlock.powerBlockRequired && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    25kV Power Block Required
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-0.5">
                Time Window: <span className="text-gray-900 font-semibold">{selectedBlock.startTime} to {selectedBlock.endTime}</span> ({selectedBlock.durationHours} hrs) • 
                Participating Crews: <span className="text-amber-400 font-semibold">{selectedBlock.participatingDepartments.join(', ')}</span> •
                Associated Tasks: <span className="text-cyan-400 font-mono font-semibold">{selectedBlock.taskIds.join(', ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase">Downtime Hours Saved</div>
              <div className="text-sm font-extrabold text-emerald-400">
                +{selectedBlock.downtimeSavedHours} hrs Saved
              </div>
            </div>
            <button
              onClick={() => setSelectedBlock(null)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
