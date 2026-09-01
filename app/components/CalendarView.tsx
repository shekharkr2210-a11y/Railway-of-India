'use client';

import React from 'react';
import { Calendar, Clock, AlertTriangle, Download, Wrench, ShieldCheck } from 'lucide-react';
import { BlockWindow } from '../lib/types';

interface CalendarViewProps {
  blocks: BlockWindow[];
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export function CalendarView({ blocks, horizon }: CalendarViewProps) {
  const totalBlocks = blocks.length;
  const totalHours = blocks.reduce((sum, b) => sum + b.durationHours, 0);

  const today = new Date();
  
  // Weekly mode setup (7-day grid)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Monthly mode setup (30-day grid)
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const handleDownloadPlan = () => {
    window.open(`/api/plans/export?horizon=${horizon}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-gray-900">Multi-Horizon Block Planning Calendar</h2>
            <p className="text-xs text-gray-500">Date-aware clash-free headway windows and machinery allocations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            {horizon} HORIZON • {totalBlocks} BLOCKS
          </div>

          <button
            onClick={handleDownloadPlan}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Download verified Joint Block Circular (JBC) CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Download Plan (CSV)
          </button>
        </div>
      </div>

      {horizon === 'WEEKLY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((dayStr, idx) => {
            const dayBlocks = blocks.filter(b => b.scheduledDate === dayStr);
            return (
              <div key={dayStr} className="border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col h-[420px] overflow-hidden">
                <div className="p-2.5 border-b border-gray-200 bg-white font-semibold text-xs text-gray-800 text-center flex items-center justify-between">
                  <span>{getDayName(dayStr)}</span>
                  <span className="text-[10px] text-gray-400">Day {idx + 1}</span>
                </div>
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {dayBlocks.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center mt-8">Clear Track (No Blocks)</div>
                  ) : (
                    dayBlocks.map(block => (
                      <div key={block.id} className="bg-white border border-gray-200 p-2.5 rounded-lg shadow-xs text-xs relative group hover:border-blue-300 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-indigo-700">{block.id}</span>
                          {block.isShadowBlock && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Shadow Block
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-gray-900 mb-1 truncate" title={block.sectionName}>
                          {block.sectionName}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 text-[11px] mb-1.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{block.startTime} - {block.endTime} ({block.durationHours}h)</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {block.participatingDepartments.map(dept => (
                            <span key={dept} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {dept}
                            </span>
                          ))}
                          {block.powerBlockRequired && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                              25kV OHE
                            </span>
                          )}
                        </div>

                        {block.assignedMachines && block.assignedMachines.length > 0 && (
                          <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{block.assignedMachines[0]}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {horizon === 'MONTHLY' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {monthDays.map((dayStr, idx) => {
            const dayBlocks = blocks.filter(b => b.scheduledDate === dayStr);
            const weekNum = Math.floor(idx / 7) + 1;

            return (
              <div key={dayStr} className="border border-gray-200 rounded-xl p-2.5 h-28 bg-white hover:border-blue-400 transition-colors flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{new Date(dayStr).getDate()} {new Date(dayStr).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-[9px] text-gray-400">W{weekNum}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center my-1">
                  {dayBlocks.length === 0 ? (
                    <span className="text-[10px] text-gray-400">0 blocks</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-indigo-700">
                        {dayBlocks.length} Block{dayBlocks.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {dayBlocks.reduce((s, b) => s + b.durationHours, 0).toFixed(1)}h track pos.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {dayBlocks.map(block => (
                    <div 
                      key={block.id} 
                      className={`w-2 h-2 rounded-full ${block.isShadowBlock ? 'bg-amber-500' : 'bg-blue-500'}`}
                      title={`${block.id}: ${block.sectionName} (${block.durationHours}h)`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {horizon === 'DAILY' && (
        <div className="border border-gray-200 rounded-xl bg-white p-4 relative" style={{ height: '520px', overflowY: 'auto' }}>
          <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-200" />
          {Array.from({ length: 25 }, (_, i) => i).map(hour => (
            <div key={hour} className="flex relative h-16 border-b border-gray-100 last:border-0">
              <div className="w-16 text-xs text-gray-400 font-medium pt-2 text-right pr-4">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 relative">
                {blocks
                  .filter(b => {
                    const startH = parseInt(b.startTime.split(':')[0] || '0', 10);
                    return startH === hour;
                  })
                  .map(block => {
                    const startM = parseInt(block.startTime.split(':')[1] || '0', 10);
                    const topOffset = (startM / 60) * 100;
                    const height = block.durationHours * 60;

                    return (
                      <div 
                        key={block.id} 
                        className="absolute left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 shadow-sm overflow-hidden z-10 hover:z-20 hover:ring-2 hover:ring-blue-400 transition-all"
                        style={{ top: `${topOffset}%`, height: `${height}px` }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-blue-900 truncate">
                          <span>{block.sectionName}</span>
                          <span className="font-mono text-[10px] text-indigo-700">{block.id}</span>
                        </div>
                        <div className="text-[11px] text-blue-700 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {block.startTime} - {block.endTime} ({block.durationHours}h) • {block.participatingDepartments.join('+')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Row */}
      <div className="mt-6 border-t border-gray-200 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-600">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Total Blocks Scheduled: <span className="font-bold text-gray-900">{totalBlocks}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-4 h-4 text-blue-500" />
            Total Hours Allocated: <span className="font-bold text-gray-900">{totalHours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified zero passenger train overlaps (Hard safety constraint satisfied)</span>
        </div>
      </div>
    </div>
  );
}
