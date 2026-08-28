import React from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { BlockWindow } from '../lib/types';

interface CalendarViewProps {
  blocks: BlockWindow[];
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export function CalendarView({ blocks, horizon }: CalendarViewProps) {
  // Common calculation
  const totalBlocks = blocks.length;
  const totalHours = blocks.reduce((sum, b) => sum + b.durationHours, 0);

  const today = new Date();
  
  // Weekly mode setup
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Monthly mode setup
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Calendar Planning View</h2>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          {horizon} HORIZON
        </div>
      </div>

      {horizon === 'WEEKLY' && (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(dayStr => {
            const dayBlocks = blocks.filter(b => b.scheduledDate === dayStr);
            return (
              <div key={dayStr} className="border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col h-96 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-white font-semibold text-sm text-gray-700 text-center">
                  {getDayName(dayStr)}
                </div>
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {dayBlocks.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center mt-4">No blocks</div>
                  ) : (
                    dayBlocks.map(block => (
                      <div key={block.id} className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm text-xs relative group">
                        <div className="font-bold text-gray-800 mb-1 truncate" title={block.sectionName}>
                          {block.sectionName}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 mb-2">
                          <Clock className="w-3 h-3" />
                          <span>{block.startTime} - {block.endTime} ({block.durationHours}h)</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {block.participatingDepartments.map(dept => (
                            <span key={dept} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {dept}
                            </span>
                          ))}
                        </div>
                        {block.isShadowBlock && (
                          <div className="absolute top-2 right-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
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
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map(dayStr => {
            const dayBlocks = blocks.filter(b => b.scheduledDate === dayStr);
            return (
              <div key={dayStr} className="border border-gray-200 rounded-lg p-2 h-24 bg-white hover:border-blue-300 transition-colors flex flex-col">
                <div className="text-xs font-medium text-gray-500 mb-2">{new Date(dayStr).getDate()}</div>
                <div className="flex-1 flex flex-wrap gap-1 content-start">
                  {dayBlocks.map(block => {
                    let color = 'bg-blue-500';
                    if (block.trainImpactMinutes > 30) color = 'bg-red-500';
                    else if (block.trainImpactMinutes > 15) color = 'bg-orange-500';

                    return (
                      <div 
                        key={block.id} 
                        className={"w-2 h-2 rounded-full " + color}
                        title={block.sectionName + " (" + block.durationHours + "h)"}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {horizon === 'DAILY' && (
        <div className="border border-gray-200 rounded-xl bg-white p-4 relative" style={{ height: '600px', overflowY: 'auto' }}>
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
                    const height = (block.durationHours) * 64;

                    return (
                      <div 
                        key={block.id} 
                        className="absolute left-2 right-2 bg-blue-50 border border-blue-200 rounded-md p-2 shadow-sm overflow-hidden z-10 hover:z-20 hover:ring-2 hover:ring-blue-400 transition-all"
                        style={{ top: topOffset + '%', height: height + 'px' }}
                      >
                        <div className="text-xs font-bold text-blue-900 truncate">{block.sectionName}</div>
                        <div className="text-[10px] text-blue-700 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {block.startTime} - {block.endTime}
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
      <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Total Blocks Scheduled: <span className="font-bold text-gray-900">{totalBlocks}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4 text-blue-500" />
            Total Hours Allocated: <span className="font-bold text-gray-900">{totalHours.toFixed(1)}h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
