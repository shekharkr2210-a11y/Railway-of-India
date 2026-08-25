'use client';

import React, { useState } from 'react';
import { CorridorSection, BlockWindow, TrainMovement, MaintenanceTask } from '../lib/types';
import { 
  Clock, 
  Layers, 
  Train, 
  AlertCircle, 
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
}

export const TimeSpaceGantt: React.FC<TimeSpaceGanttProps> = ({
  sections,
  blocks,
  trains,
  tasks,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<BlockWindow | null>(null);

  // Convert "HH:mm" to hour float (e.g. "11:30" -> 11.5)
  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
  };

  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl overflow-hidden">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Time-Space Multi-Track Gantt Planner
          </h2>
          <p className="text-xs text-slate-400">
            Coordinated Corridor Schedule • Trains (diagonal movement vectors) & Shadow Blocks (maintenance windows)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400"></span>
            <span className="text-slate-300 font-medium">✨ Shadow Block (Multi-Dept)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/80 border border-blue-400"></span>
            <span className="text-slate-300 font-medium">Single Dept Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400"></span>
            <span className="text-slate-300 font-medium">Express Train Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400"></span>
            <span className="text-slate-300 font-medium">Goods Freight Path</span>
          </div>
        </div>
      </div>

      {/* Gantt Grid Container */}
      <div className="relative overflow-x-auto bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="min-w-[900px]">
          {/* Time Header (X-Axis: 00:00 to 24:00) */}
          <div className="grid grid-cols-[160px_1fr] border-b border-slate-800 pb-2 mb-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Corridor Section
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
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
                  className="grid grid-cols-[160px_1fr] items-center border-b border-slate-800/60 pb-4 relative group"
                >
                  {/* Section Label */}
                  <div className="pr-3">
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {section.code}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {section.startKm}-{section.endKm} KM ({section.tracks} tracks)
                    </div>
                  </div>

                  {/* Time Grid Row Canvas */}
                  <div className="relative h-14 bg-slate-900/50 rounded-lg border border-slate-800/80 overflow-hidden">
                    {/* Hourly Vertical Grid Lines */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      {hours.map(h => (
                        <div key={h} className="h-full border-r border-slate-800/40"></div>
                      ))}
                    </div>

                    {/* Block Windows Rendering */}
                    {sectionBlocks.map(block => {
                      const startH = parseHour(block.startTime);
                      const endH = parseHour(block.endTime);
                      const leftPct = (startH / 24) * 100;
                      const widthPct = ((endH - startH) / 24) * 100;

                      return (
                        <div
                          key={block.id}
                          onClick={() => setSelectedBlock(block)}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className={`absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:z-20 p-1.5 flex flex-col justify-between shadow-md ${
                            block.isShadowBlock
                              ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border border-emerald-400 text-white shadow-emerald-500/20'
                              : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-blue-400 text-white shadow-blue-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="truncate flex items-center gap-1">
                              {block.isShadowBlock && <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />}
                              {block.startTime}-{block.endTime}
                            </span>
                            <span className="bg-slate-950/60 px-1 rounded text-[9px]">
                              {block.durationHours}h
                            </span>
                          </div>
                          <div className="text-[9px] font-semibold tracking-tight truncate opacity-90">
                            Depts: {block.participatingDepartments.join(' + ')}
                          </div>
                        </div>
                      );
                    })}

                    {/* Train Paths Rendering (Vector overlays) */}
                    {sectionTrains.map(train => {
                      const entryH = parseHour(train.entryTime);
                      const exitH = parseHour(train.exitTime);
                      const leftPct = (entryH / 24) * 100;
                      const widthPct = ((exitH - entryH) / 24) * 100;

                      return (
                        <div
                          key={train.id}
                          title={`${train.trainNumber} - ${train.trainName} (${train.entryTime} to ${train.exitTime})`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className="absolute top-1/2 -translate-y-1/2 h-1 pointer-events-auto cursor-pointer group/train"
                        >
                          <div
                            className={`h-full rounded-full transition-all group-hover/train:h-2 ${
                              train.type === 'PASSENGER_EXPRESS'
                                ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                                : 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                            }`}
                          ></div>
                          <span className="absolute -top-5 left-0 text-[9px] font-bold px-1 rounded bg-slate-900/90 border border-slate-700 text-slate-200 hidden group-hover/train:block whitespace-nowrap z-30">
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

      {/* Selected Block Info Card */}
      {selectedBlock && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">
                  Block Details: {selectedBlock.id} ({selectedBlock.sectionName})
                </h4>
                {selectedBlock.isShadowBlock && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Multi-Department Shadow Block
                  </span>
                )}
              </div>
              <p className="text-slate-400 mt-0.5">
                Time Window: <span className="text-white font-semibold">{selectedBlock.startTime} to {selectedBlock.endTime}</span> ({selectedBlock.durationHours} hrs) • 
                Participating Departments: <span className="text-amber-400 font-semibold">{selectedBlock.participatingDepartments.join(', ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Downtime Hours Saved</div>
              <div className="text-sm font-extrabold text-emerald-400">
                +{selectedBlock.downtimeSavedHours} hrs Saved
              </div>
            </div>
            <button
              onClick={() => setSelectedBlock(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
