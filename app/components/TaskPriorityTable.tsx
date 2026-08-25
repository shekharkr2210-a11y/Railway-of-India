'use client';

import React, { useState } from 'react';
import { MaintenanceTask, Department, TaskSeverity } from '../lib/types';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Zap,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

interface TaskPriorityTableProps {
  tasks: MaintenanceTask[];
  onToggleTaskStatus: (taskId: string) => void;
}

export const TaskPriorityTable: React.FC<TaskPriorityTableProps> = ({
  tasks,
  onToggleTaskStatus,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter(task => {
    const matchesDept = selectedDept === 'ALL' || task.department === selectedDept;
    const matchesSev = selectedSeverity === 'ALL' || task.severity === selectedSeverity;
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.sourceSystem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSev && matchesSearch;
  });

  return (
    <div className="bg-gray-100/80 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            TMS, SMMS & TDMS Maintenance Task Prioritization Queue
          </h2>
          <p className="text-xs text-gray-500">
            AI Criticality Index (TCI) ranks defects based on safety risk, overdue days, and traffic speed impact
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search defect, section..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors w-48"
            />
          </div>

          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ENG">TMS - Track Engineering</option>
            <option value="TRD">TDMS - Traction (OHE)</option>
            <option value="SMMS">SMMS - Signal & Telecom</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
        </div>
      </div>

      {/* Task Queue Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">TCI Score</th>
              <th className="py-3 px-4">Source System</th>
              <th className="py-3 px-4">Task & Defect Description</th>
              <th className="py-3 px-4">Corridor Location</th>
              <th className="py-3 px-4">Est. Duration</th>
              <th className="py-3 px-4">Overdue</th>
              <th className="py-3 px-4">Power Block</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {filteredTasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-100/50 transition-colors group">
                {/* TCI Score Badge */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shadow-md ${
                      task.criticalityScore >= 90
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : task.criticalityScore >= 80
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {task.criticalityScore}
                    </span>
                  </div>
                </td>

                {/* Source System Badge */}
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    task.department === 'ENG' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    task.department === 'TRD' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {task.sourceSystem} ({task.department})
                  </span>
                </td>

                {/* Title & Speed Impact */}
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-amber-400 transition-colors">
                    {task.title}
                  </div>
                  {task.speedRestrictionImpactKmvh > 0 && (
                    <div className="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      TSR Impact: -{task.speedRestrictionImpactKmvh} km/h speed restriction if delayed
                    </div>
                  )}
                </td>

                {/* Corridor Section */}
                <td className="py-3 px-4">
                  <span className="font-semibold text-gray-800">{task.sectionName}</span>
                  <div className="text-[10px] text-gray-500 font-mono">
                    KM {task.startKm} - {task.endKm}
                  </div>
                </td>

                {/* Est Duration */}
                <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                  {task.estimatedDurationHours} hrs
                </td>

                {/* Overdue Days */}
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.overdueDays >= 7 ? 'bg-red-500/20 text-red-300' : 'bg-gray-100 text-gray-500'
                  }`}>
                    +{task.overdueDays} days
                  </span>
                </td>

                {/* Power Block Requirement */}
                <td className="py-3 px-4">
                  {task.requiresPowerBlock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
                      <Zap className="w-3 h-3 text-purple-300" />
                      25kV OHE
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">None</span>
                  )}
                </td>

                {/* Status Toggle */}
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onToggleTaskStatus(task.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      task.status === 'SCHEDULED' || task.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                    }`}
                  >
                    {task.status === 'SCHEDULED' || task.status === 'APPROVED'
                      ? '✓ Scheduled'
                      : 'Pending Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
