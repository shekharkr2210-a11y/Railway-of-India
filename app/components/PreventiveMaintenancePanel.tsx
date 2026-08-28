import React, { useState, useMemo } from 'react';
import { MaintenanceTask, CorridorSection, Department } from '../lib/types';
import { 
  generatePreventiveMaintenanceSchedule, 
  STANDARD_MAINTENANCE_CYCLES, 
  PreventiveMaintenanceStatus 
} from '../lib/preventiveMaintenanceEngine';
import { Calendar, AlertTriangle, Clock, CheckCircle, Shield, Wrench } from 'lucide-react';

interface PreventiveMaintenancePanelProps {
  sections: CorridorSection[];
  tasks: MaintenanceTask[];
}

export const PreventiveMaintenancePanel: React.FC<PreventiveMaintenancePanelProps> = ({ sections, tasks }) => {
  const [filterDepartment, setFilterDepartment] = useState<'ALL' | Department>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVERDUE' | 'DUE_THIS_WEEK' | 'DUE_THIS_MONTH' | 'ON_SCHEDULE'>('ALL');

  const pmStatuses = useMemo(() => generatePreventiveMaintenanceSchedule(sections, tasks), [sections, tasks]);

  const filteredStatuses = useMemo(() => {
    return pmStatuses.filter(s => {
      if (filterDepartment !== 'ALL' && s.department !== filterDepartment) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      return true;
    });
  }, [pmStatuses, filterDepartment, filterStatus]);

  const overdueCount = pmStatuses.filter(s => s.status === 'OVERDUE').length;
  const dueThisWeekCount = pmStatuses.filter(s => s.status === 'DUE_THIS_WEEK').length;
  const dueThisMonthCount = pmStatuses.filter(s => s.status === 'DUE_THIS_MONTH').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cycles Tracked</p>
            <p className="text-2xl font-bold text-gray-900">{pmStatuses.length}</p>
          </div>
        </div>
        
        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          </div>
        </div>

        <div className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Due This Week</p>
            <p className="text-2xl font-bold text-yellow-600">{dueThisWeekCount}</p>
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Due This Month</p>
            <p className="text-2xl font-bold text-blue-600">{dueThisMonthCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value as any)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="ALL">All Departments</option>
          <option value="ENG">Civil Eng (ENG)</option>
          <option value="TRD">Traction (TRD)</option>
          <option value="SMMS">Signaling (SMMS)</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="OVERDUE">Overdue</option>
          <option value="DUE_THIS_WEEK">Due This Week</option>
          <option value="DUE_THIS_MONTH">Due This Month</option>
          <option value="ON_SCHEDULE">On Schedule</option>
        </select>
      </div>

      {/* Status Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-900 border-b border-gray-200 font-medium">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Last Performed</th>
              <th className="px-4 py-3">Next Due</th>
              <th className="px-4 py-3">Days Until Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Duration (hrs)</th>
              <th className="px-4 py-3">Power Block</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStatuses.map(status => {
              const rowColor = 
                status.status === 'OVERDUE' ? 'bg-red-50' :
                status.status === 'DUE_THIS_WEEK' ? 'bg-yellow-50' :
                status.status === 'DUE_THIS_MONTH' ? 'bg-blue-50' : 'bg-green-50';
              
              const statusColor = 
                status.status === 'OVERDUE' ? 'text-red-700 bg-red-100' :
                status.status === 'DUE_THIS_WEEK' ? 'text-yellow-700 bg-yellow-100' :
                status.status === 'DUE_THIS_MONTH' ? 'text-blue-700 bg-blue-100' : 'text-green-700 bg-green-100';

              return (
                <tr key={status.cycleId} className={rowColor}>
                  <td className="px-4 py-3 font-medium text-gray-900">{status.activity}</td>
                  <td className="px-4 py-3">{status.department}</td>
                  <td className="px-4 py-3">{status.sectionName}</td>
                  <td className="px-4 py-3">{status.lastPerformedDate || 'Never'}</td>
                  <td className="px-4 py-3">{status.nextDueDate}</td>
                  <td className="px-4 py-3 font-bold">{status.daysUntilDue}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                      {status.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{status.estimatedDurationHours}</td>
                  <td className="px-4 py-3">{status.requiresPowerBlock ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
            {filteredStatuses.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No preventive maintenance cycles match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reference Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-gray-500" />
          Standard Maintenance Cycles Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2">Freq (Days)</th>
                <th className="px-3 py-2">Route Class</th>
                <th className="px-3 py-2">Desc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {STANDARD_MAINTENANCE_CYCLES.map(cycle => (
                <tr key={cycle.id}>
                  <td className="px-3 py-2 font-medium">{cycle.id}</td>
                  <td className="px-3 py-2">{cycle.category}</td>
                  <td className="px-3 py-2">{cycle.department}</td>
                  <td className="px-3 py-2">{cycle.frequencyDays}</td>
                  <td className="px-3 py-2">{cycle.applicableRouteClass}</td>
                  <td className="px-3 py-2 truncate max-w-xs" title={cycle.description}>{cycle.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
