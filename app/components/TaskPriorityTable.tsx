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
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { AIExplainabilityModal } from './AIExplainabilityModal';
import { CreateTaskModal } from './CreateTaskModal';

interface TaskPriorityTableProps {
  tasks: MaintenanceTask[];
  onToggleTaskStatus: (taskId: string) => void;
  onTaskCreated?: (task: MaintenanceTask) => void;
}

export const TaskPriorityTable: React.FC<TaskPriorityTableProps> = ({
  tasks,
  onToggleTaskStatus,
  onTaskCreated,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [xaiTask, setXaiTask] = useState<MaintenanceTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'CRITICALITY_DESC' | 'CRITICALITY_ASC' | 'OVERDUE_DESC' | 'DURATION_DESC'>('CRITICALITY_DESC');

  let filteredTasks = tasks.filter(task => {
    const matchesDept = selectedDept === 'ALL' || task.department === selectedDept;
    const matchesSev = selectedSeverity === 'ALL' || task.severity === selectedSeverity;
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.sourceSystem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSev && matchesSearch;
  });

  filteredTasks.sort((a, b) => {
    if (sortBy === 'CRITICALITY_DESC') return b.criticalityScore - a.criticalityScore;
    if (sortBy === 'CRITICALITY_ASC') return a.criticalityScore - b.criticalityScore;
    if (sortBy === 'OVERDUE_DESC') return b.overdueDays - a.overdueDays;
    if (sortBy === 'DURATION_DESC') return b.estimatedDurationHours - a.estimatedDurationHours;
    return 0;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Dept', 'Severity', 'Overdue Days', 'Duration (hrs)', 'Speed Impact', 'Score'];
    const rows = filteredTasks.map(t => [
      t.id, 
      `"${t.title.replace(/"/g, '""')}"`, 
      t.department, 
      t.severity, 
      t.overdueDays, 
      t.estimatedDurationHours, 
      t.speedRestrictionImpactKmvh, 
      t.criticalityScore
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            TMS, SMMS & TDMS Maintenance Task Prioritization Queue
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI Track Criticality Index (TCI) ranks defects based on safety risk, overdue days, and traffic speed impact. Click any TCI score to inspect mathematical weight attribution.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search defect, section..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CRITICALITY_DESC">Sort: Criticality Score (Desc)</option>
            <option value="CRITICALITY_ASC">Sort: Criticality Score (Asc)</option>
            <option value="OVERDUE_DESC">Sort: Overdue Days (Desc)</option>
            <option value="DURATION_DESC">Sort: Duration (Desc)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-medium hover:bg-indigo-100 transition flex items-center gap-1.5"
          >
            📥 Export CSV
          </button>

          {/* Register Defect Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-1.5"
          >
            ➕ Register Defect / Work Order
          </button>
        </div>
      </div>

      {/* Task Queue Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">TCI Score (XAI)</th>
              <th className="py-3 px-4">Source System</th>
              <th className="py-3 px-4">Task & Defect Description</th>
              <th className="py-3 px-4">Corridor Location</th>
              <th className="py-3 px-4">Est. Duration</th>
              <th className="py-3 px-4">Overdue</th>
              <th className="py-3 px-4">Power Block</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filteredTasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50/80 transition-colors group">
                {/* TCI Score Badge with XAI Inspector trigger */}
                <td className="py-3 px-4">
                  <button
                    onClick={() => setXaiTask(task)}
                    className="flex items-center gap-1.5 group/btn cursor-pointer"
                    title="Click to inspect Explainable AI (XAI) mathematical decomposition"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shadow-xs transition-transform group-hover/btn:scale-105 ${
                      task.criticalityScore >= 90
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : task.criticalityScore >= 80
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                      {task.criticalityScore}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 opacity-60 group-hover/btn:opacity-100" />
                  </button>
                </td>

                {/* Source System Badge */}
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    task.department === 'ENG' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    task.department === 'TRD' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {task.sourceSystem} ({task.department})
                  </span>
                </td>

                {/* Title & Speed Impact */}
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </div>
                  {task.speedRestrictionImpactKmvh > 0 && (
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
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
                    task.overdueDays >= 7 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    +{task.overdueDays} days
                  </span>
                </td>

                {/* Power Block Requirement */}
                <td className="py-3 px-4">
                  {task.requiresPowerBlock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                      <Zap className="w-3 h-3 text-purple-600" />
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
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
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

      {/* XAI Explainability Modal */}
      {xaiTask && (
        <AIExplainabilityModal
          task={xaiTask}
          onClose={() => setXaiTask(null)}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={(task) => {
            setShowCreateModal(false);
            if (onTaskCreated) {
              onTaskCreated(task);
            }
          }}
        />
      )}
    </div>
  );
};
