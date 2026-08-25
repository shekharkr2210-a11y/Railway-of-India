'use client';

import React, { useState } from 'react';
import { CorridorSection, MaintenanceTask, BlockWindow, TrainMovement } from '../lib/types';
import { 
  Train, 
  AlertOctagon, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface CorridorMapProps {
  sections: CorridorSection[];
  tasks: MaintenanceTask[];
  blocks: BlockWindow[];
  trains: TrainMovement[];
  onSelectSection: (sectionId: string) => void;
  selectedSectionId: string | null;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  sections,
  tasks,
  blocks,
  trains,
  onSelectSection,
  selectedSectionId,
}) => {
  const [filterDept, setFilterDept] = useState<string>('ALL');

  return (
    <div className="bg-gray-100/80 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Linear Corridor Asset & Active Block Visualizer
          </h2>
          <p className="text-xs text-gray-500">
            Delhi - Kanpur Trunk Route (440 KM) • Real-time maintenance co-location & train movement tracking
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Filter Dept:</span>
          <button
            onClick={() => setFilterDept('ALL')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterDept === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterDept('ENG')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterDept === 'ENG'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            Civil (TMS)
          </button>
          <button
            onClick={() => setFilterDept('TRD')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterDept === 'TRD'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            TRD (OHE)
          </button>
          <button
            onClick={() => setFilterDept('SMMS')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterDept === 'SMMS'
                ? 'bg-emerald-500 text-white font-bold'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            Signal (SMMS)
          </button>
        </div>
      </div>

      {/* Corridor Visual Track Bar */}
      <div className="space-y-6">
        {/* Track Line Representation */}
        <div className="relative pt-8 pb-4 px-4 bg-white/70 border border-gray-200/80 rounded-xl overflow-x-auto">
          {/* Main Rail Line Graphic */}
          <div className="relative h-20 flex items-center min-w-[700px]">
            {/* Double Track Rail Lines */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-2 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 opacity-40"></div>
            <div className="absolute left-0 right-0 top-1/2 translate-y-1 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 opacity-40"></div>

            {/* Station Nodes & Section Segments */}
            <div className="w-full flex justify-between items-center relative z-10">
              {sections.map((section, idx) => {
                const sectionTasks = tasks.filter(
                  t => t.sectionId === section.id && (filterDept === 'ALL' || t.department === filterDept)
                );
                const sectionBlocks = blocks.filter(b => b.sectionId === section.id);
                const shadowCount = sectionBlocks.filter(b => b.isShadowBlock).length;
                const isSelected = selectedSectionId === section.id;

                return (
                  <div
                    key={section.id}
                    onClick={() => onSelectSection(section.id)}
                    className={`group flex-1 cursor-pointer relative px-2 transition-all`}
                  >
                    {/* Station Marker Dot */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-50 border-2 border-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-125 transition-transform">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-gray-700 tracking-wider whitespace-nowrap bg-gray-50/90 px-1.5 py-0.5 rounded border border-gray-200">
                        {section.code.split('-')[0]} ({section.startKm} KM)
                      </span>
                    </div>

                    {/* Section Bar Box */}
                    <div
                      className={`mx-3 p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-gray-50/90 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-800">{section.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                          {section.lengthKm} KM
                        </span>
                      </div>

                      {/* Department Task Indicators */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {sectionTasks.map(t => (
                          <div
                            key={t.id}
                            title={`${t.departmentName}: ${t.title} (${t.severity})`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                              t.department === 'ENG'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : t.department === 'TRD'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {t.severity === 'CRITICAL' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                            )}
                            {t.department}
                          </div>
                        ))}
                      </div>

                      {/* Shadow Block Status Badge */}
                      {shadowCount > 0 && (
                        <div className="mt-2 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center justify-between">
                          <span>✨ {shadowCount} Shadow Block</span>
                          <span className="text-gray-500 font-normal">Merged</span>
                        </div>
                      )}
                    </div>

                    {/* End Station Node for Last Section */}
                    {idx === sections.length - 1 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-gray-50 border-2 border-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        </div>
                        <span className="mt-2 text-[10px] font-bold text-gray-700 tracking-wider whitespace-nowrap bg-gray-50/90 px-1.5 py-0.5 rounded border border-gray-200">
                          {section.code.split('-')[1]} ({section.endKm} KM)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Section Detail Panel */}
        {selectedSectionId && (
          <div className="bg-white/95 border border-amber-500/30 rounded-xl p-5 animation-fade-in">
            {(() => {
              const activeSec = sections.find(s => s.id === selectedSectionId)!;
              const secTasks = tasks.filter(t => t.sectionId === selectedSectionId);
              const secBlocks = blocks.filter(b => b.sectionId === selectedSectionId);

              return (
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                        Section Deep Dive: {activeSec.name} ({activeSec.code})
                      </h3>
                      <p className="text-xs text-gray-500">
                        KM {activeSec.startKm} to KM {activeSec.endKm} • Density:{' '}
                        <span className="text-amber-400 font-semibold">{activeSec.trafficDensity}</span> ({activeSec.dailyTrainCount} trains/day)
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectSection('')}
                      className="text-xs text-gray-500 hover:text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md"
                    >
                      Close Deep Dive
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Maintenance Tasks in this section */}
                    <div className="bg-gray-50/90 p-4 rounded-xl border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        Integrated Tasks ({secTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {secTasks.map(task => (
                          <div
                            key={task.id}
                            className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs flex items-start justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  task.department === 'ENG' ? 'bg-blue-500/20 text-blue-300' :
                                  task.department === 'TRD' ? 'bg-purple-500/20 text-purple-300' :
                                  'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {task.sourceSystem} ({task.department})
                                </span>
                                <span className="font-semibold text-gray-900">{task.title}</span>
                              </div>
                              <div className="text-[11px] text-gray-500">
                                KM {task.startKm} - {task.endKm} • Est: {task.estimatedDurationHours} hrs • Overdue: {task.overdueDays}d
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              TCI: {task.criticalityScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optimized Blocks for this section */}
                    <div className="bg-gray-50/90 p-4 rounded-xl border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        AI Optimized Block Windows ({secBlocks.length})
                      </h4>
                      <div className="space-y-2">
                        {secBlocks.map(block => (
                          <div
                            key={block.id}
                            className="p-2.5 rounded-lg bg-white border border-amber-500/30 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-amber-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {block.startTime} - {block.endTime} ({block.durationHours} hrs)
                              </span>
                              {block.isShadowBlock && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✨ Shadow Block (-{block.downtimeSavedHours}h saved)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center justify-between mt-1">
                              <span>Departments: {block.participatingDepartments.join(' + ')}</span>
                              <span>Power Block: {block.powerBlockRequired ? '⚡ YES (25kV OHE)' : 'NO'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
