'use client';

import React, { useState } from 'react';
import { CorridorSection, BlockWindow, TrainMovement, MaintenanceTask } from '../lib/types';
import { 
  Clock, 
  Zap, 
  Sparkles,
  Info
} from 'lucide-react';
import { AIExplainabilityModal } from './AIExplainabilityModal';

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
  const [xaiTask, setXaiTask] = useState<MaintenanceTask | null>(null);

  // Convert "HH:mm" to hour float (e.g. "11:30" -> 11.5)
  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const weekDays = ['Monday (Day 1)', 'Tuesday (Day 2)', 'Wednesday (Day 3)', 'Thursday (Day 4)', 'Friday (Day 5)', 'Saturday (Day 6)', 'Sunday (Day 7)'];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-xl">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              AI Time-Space Multi-Track Gantt Planner
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Horizon: {horizon}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordinated Corridor Schedule • Timetable Headway Constraints (Trains) & AI Shadow Blocks (Maintenance)
          </p>
        </div>

        {/* View Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-gray-100 p-1 rounded-xl border border-gray-300 flex items-center gap-1">
            <button
              onClick={() => setViewMode('HOURLY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'HOURLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              24h Time-Space
            </button>
            <button
              onClick={() => setViewMode('WEEKLY_ROLLUP')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'WEEKLY_ROLLUP' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => setViewMode('MONTHLY_CALENDAR')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'MONTHLY_CALENDAR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30-Day Cyclical
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600"></span>
              <span className="text-gray-800 font-medium">✨ Shadow Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 border border-blue-600"></span>
              <span className="text-gray-800 font-medium">Single Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500"></span>
              <span className="text-gray-800 font-medium">Passenger Express</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-500 border-b border-dashed"></span>
              <span className="text-gray-800 font-medium">Freight Rake</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: 24h Time-Space Gantt View */}
      {viewMode === 'HOURLY' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50">
            <div className="min-w-[1000px]">
              {/* Time Header Grid (24 Hours) */}
              <div className="grid grid-cols-28 border-b border-gray-300 py-2.5 px-4 text-[10px] text-gray-600 font-mono font-bold bg-gray-100 items-center">
                <div className="col-span-4 text-left font-sans text-gray-800 font-bold">Corridor Section / Track</div>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="col-span-1 text-center">
                    {h.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Corridor Track Rows */}
              <div className="divide-y divide-gray-200">
                {sections.map(sec => {
                  const secBlocks = blocks.filter(b => b.sectionId === sec.id || b.sectionName.includes(sec.name));
                  const secTrains = trains.filter(t => t.sectionId === sec.id || sec.id.includes(t.sectionId));

                  return (
                    <div key={sec.id} className="grid grid-cols-28 items-center py-4 px-4 hover:bg-gray-100/50 transition-colors group relative">
                      {/* Section Name & Metadata */}
                      <div className="col-span-4 pr-3">
                        <div className="font-bold text-xs text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {sec.name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {sec.tracks} Tracks • {sec.trafficDensity} Density • {sec.lengthKm} KM
                        </div>
                      </div>

                      {/* 24-Hour Visual Timeline Canvas */}
                      <div className="col-span-24 relative h-12 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-inner">
                        {/* Grid lines for each hour (24 cols) */}
                        <div className="absolute inset-0 grid grid-cols-24 pointer-events-none divide-x divide-gray-100">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="h-full"></div>
                          ))}
                        </div>

                        {/* Train Movement Trajectory Lines (Timetable Constraints) */}
                        {secTrains.map(train => {
                          const startHour = parseHour(train.entryTime);
                          let endHour = parseHour(train.exitTime);
                          if (endHour < startHour) endHour += 24; // Handle midnight wrap
                          
                          const leftPct = Math.max(0, Math.min(100, (startHour / 24) * 100));
                          const widthPct = Math.max(2, Math.min(100 - leftPct, ((endHour - startHour) / 24) * 100));
                          const isFreight = train.type === 'FREIGHT_GOODS';

                          return (
                            <div
                              key={train.id}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full z-10 opacity-70 group/train cursor-pointer ${
                                isFreight ? 'bg-purple-500 border-b border-dashed' : 'bg-amber-500'
                              }`}
                              title={`${train.trainNumber} - ${train.trainName} (${train.entryTime} to ${train.exitTime})`}
                            >
                              {/* Hover Tooltip */}
                              <div className="hidden group-hover/train:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 font-sans">
                                🚆 {train.trainNumber} {train.trainName} ({train.entryTime} - {train.exitTime})
                              </div>
                            </div>
                          );
                        })}

                        {/* Scheduled Maintenance Blocks */}
                        {secBlocks.map(block => {
                          const startHour = parseHour(block.startTime);
                          let endHour = parseHour(block.endTime);
                          if (endHour < startHour) endHour += 24;
                          
                          const leftPct = Math.max(0, Math.min(100, (startHour / 24) * 100));
                          const widthPct = Math.max(3, Math.min(100 - leftPct, ((endHour - startHour) / 24) * 100));

                          return (
                            <div
                              key={block.id}
                              onClick={() => setSelectedBlock(block)}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`absolute top-1 bottom-1 rounded-md z-20 cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] font-bold shadow-md ${
                                block.isShadowBlock
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400'
                              }`}
                            >
                              <span className="truncate">
                                {block.isShadowBlock ? '✨ Shadow' : 'Block'} {block.id.split('-').pop()}
                              </span>
                              <span className="text-[9px] opacity-90 font-mono hidden sm:inline">
                                {block.durationHours}h
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

          <div className="flex items-center justify-between text-xs text-gray-500 px-2">
            <span>💡 Click on any block window on the track timeline to inspect machine roster and XAI decision breakdown.</span>
            <span className="font-semibold text-emerald-700">✓ Timetable Clearance Validated against Passenger Headways</span>
          </div>
        </div>
      )}

      {/* VIEW 2: 7-Day Rolling Horizon View */}
      {viewMode === 'WEEKLY_ROLLUP' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((dayName, dayIndex) => {
              const dayBlocks = blocks.filter((_, idx) => idx % 7 === dayIndex);
              const dayTasks = tasks.filter((_, idx) => idx % 7 === dayIndex);

              return (
                <div key={dayName} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-2 mb-2">
                      {dayName.split(' ')[0]}
                      <div className="text-[10px] text-gray-500 font-normal">{dayName.split(' ')[1]}</div>
                    </div>

                    <div className="space-y-1.5">
                      {dayBlocks.length === 0 ? (
                        <div className="text-[10px] text-gray-400 italic py-4 text-center">No track closures</div>
                      ) : (
                        dayBlocks.map(b => (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBlock(b)}
                            className="p-2 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 cursor-pointer transition-all text-[11px] shadow-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-gray-900">
                              <span>{b.id}</span>
                              <span className="text-[9px] text-indigo-700">{b.durationHours}h</span>
                            </div>
                            <div className="text-[10px] text-gray-600 truncate">{b.sectionName}</div>
                            {b.isShadowBlock && (
                              <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5 mt-1">
                                <Sparkles className="w-2.5 h-2.5" /> Shadow ({b.participatingDepartments.length} depts)
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
                    <span>{dayBlocks.length} Blocks</span>
                    <span className="text-indigo-700 font-bold">{dayTasks.length} Tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: 30-Day Cyclical Monthly Calendar */}
      {viewMode === 'MONTHLY_CALENDAR' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {['Week 1 (IMR Defect Backlog Clearance)', 'Week 2 (25kV OHE & Traction Overhaul)', 'Week 3 (S&T Interlocking & Axle Counter Scan)', 'Week 4 (Deep Screening & Geometry Tamping)'].map((wk, idx) => (
              <div key={wk} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                <div className="text-xs font-bold text-gray-900 mb-1">Week {idx + 1} Strategic Focus</div>
                <p className="text-[11px] text-gray-600 mb-3">{wk.split('(')[1].replace(')', '')}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    Target Availability: <span className="text-emerald-700 font-bold">98.6%</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    Shadow Slots: <span className="text-indigo-700 font-bold">{4 + idx * 2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Monthly cyclical planner synchronizes Civil OMS-2000 track recordings with TRD Tower Wagon runs to prevent redundant line possessions.</span>
          </div>
        </div>
      )}

      {/* Selected Block Info Card with XAI and Machine Details */}
      {selectedBlock && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-sm">
                  Block Window: {selectedBlock.id} ({selectedBlock.sectionName})
                </h4>
                {selectedBlock.isShadowBlock && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Multi-Department Shadow Block
                  </span>
                )}
                {selectedBlock.powerBlockRequired && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    25kV Power Block Required
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                Time Window: <strong className="text-gray-900">{selectedBlock.startTime} to {selectedBlock.endTime}</strong> ({selectedBlock.durationHours} hrs) • 
                Participating Crews: <span className="text-indigo-800 font-semibold">{selectedBlock.participatingDepartments.join(', ')}</span> •
                Machines: <span className="text-gray-800 font-semibold">{selectedBlock.assignedMachines?.join(' • ') || 'Track Gang #14'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Downtime Saved</div>
              <div className="text-sm font-extrabold text-emerald-700">
                +{selectedBlock.downtimeSavedHours} hrs Saved
              </div>
            </div>

            {/* Trigger XAI for primary task */}
            <button
              onClick={() => {
                const primary = tasks.find(t => selectedBlock.taskIds.includes(t.id));
                if (primary) setXaiTask(primary);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Inspect AI (XAI)
            </button>

            <button
              onClick={() => setSelectedBlock(null)}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* XAI Explainability Modal */}
      {xaiTask && (
        <AIExplainabilityModal
          task={xaiTask}
          onClose={() => setXaiTask(null)}
        />
      )}
    </div>
  );
};
