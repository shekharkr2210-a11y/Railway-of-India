import React from 'react';
import { MaintenanceTask } from '../lib/types';
import { Briefcase, AlertTriangle, Clock, Clock4, FileText, BarChart3, Wrench, ShieldAlert, Building2 } from 'lucide-react';

interface PendingWorksReportProps {
  tasks: MaintenanceTask[];
}

export const PendingWorksReport: React.FC<PendingWorksReportProps> = ({ tasks }) => {
  // Department breakdown
  const byDepartment = {
    ENG: tasks.filter(t => t.department === 'ENG'),
    TRD: tasks.filter(t => t.department === 'TRD'),
    SMMS: tasks.filter(t => t.department === 'SMMS'),
  };

  // Severity breakdown
  const bySeverity = {
    CRITICAL: tasks.filter(t => t.severity === 'CRITICAL'),
    HIGH: tasks.filter(t => t.severity === 'HIGH'),
    MEDIUM: tasks.filter(t => t.severity === 'MEDIUM'),
    LOW: tasks.filter(t => t.severity === 'LOW'),
  };

  // Section-wise summary
  const bySectionMap: Record<string, { sectionName: string; tasks: MaintenanceTask[]; totalHours: number; criticalCount: number }> = {};
  tasks.forEach(t => {
    if (!bySectionMap[t.sectionId]) {
      bySectionMap[t.sectionId] = { sectionName: t.sectionName, tasks: [], totalHours: 0, criticalCount: 0 };
    }
    bySectionMap[t.sectionId].tasks.push(t);
    bySectionMap[t.sectionId].totalHours += t.estimatedDurationHours;
    if (t.severity === 'CRITICAL') bySectionMap[t.sectionId].criticalCount++;
  });
  const sectionSummary = Object.entries(bySectionMap).map(([id, data]) => ({
    sectionId: id,
    sectionName: data.sectionName,
    taskCount: data.tasks.length,
    totalHours: parseFloat(data.totalHours.toFixed(1)),
    criticalCount: data.criticalCount,
  }));

  // Aging analysis
  const aging = {
    overdue0to3: tasks.filter(t => t.overdueDays >= 0 && t.overdueDays <= 3).length,
    overdue4to7: tasks.filter(t => t.overdueDays >= 4 && t.overdueDays <= 7).length,
    overdue8to14: tasks.filter(t => t.overdueDays >= 8 && t.overdueDays <= 14).length,
    overdue15plus: tasks.filter(t => t.overdueDays >= 15).length,
    averageOverdueDays: tasks.length > 0 ? parseFloat((tasks.reduce((sum, t) => sum + t.overdueDays, 0) / tasks.length).toFixed(1)) : 0,
  };

  // Work type categorization
  const categories: Record<string, { count: number; avgCriticality: number }> = {
    'Track Renewal & Tamping': { count: 0, avgCriticality: 0 },
    'Rail Defect Rectification': { count: 0, avgCriticality: 0 },
    'Routine Inspection (USFD/Geometry)': { count: 0, avgCriticality: 0 },
    'OHE Maintenance': { count: 0, avgCriticality: 0 },
    'Signal & Telecom Maintenance': { count: 0, avgCriticality: 0 },
    'Other': { count: 0, avgCriticality: 0 },
  };

  tasks.forEach(t => {
    const titleLower = t.title.toLowerCase();
    let category = 'Other';

    if (titleLower.includes('renewal') || titleLower.includes('tamping') || titleLower.includes('ballast') || titleLower.includes('cleaning')) {
      category = 'Track Renewal & Tamping';
    } else if (titleLower.includes('defect') || titleLower.includes('fracture') || titleLower.includes('weld') || titleLower.includes('rail') || titleLower.includes('grinding')) {
      category = 'Rail Defect Rectification';
    } else if (titleLower.includes('usfd') || titleLower.includes('ultrasonic') || titleLower.includes('geometry') || titleLower.includes('inspection')) {
      category = 'Routine Inspection (USFD/Geometry)';
    } else if (t.department === 'TRD' || titleLower.includes('ohe') || titleLower.includes('traction') || titleLower.includes('cantilever') || titleLower.includes('contact wire') || titleLower.includes('feeder') || titleLower.includes('insulator')) {
      category = 'OHE Maintenance';
    } else if (t.department === 'SMMS' || titleLower.includes('signal') || titleLower.includes('point machine') || titleLower.includes('interlocking') || titleLower.includes('track circuit') || titleLower.includes('relay') || titleLower.includes('ofc')) {
      category = 'Signal & Telecom Maintenance';
    }

    categories[category].count++;
    categories[category].avgCriticality += t.criticalityScore;
  });

  Object.values(categories).forEach(cat => {
    if (cat.count > 0) cat.avgCriticality = parseFloat((cat.avgCriticality / cat.count).toFixed(1));
  });

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedDurationHours, 0);
  const totalCritical = bySeverity.CRITICAL.length;

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pending</p>
            <h3 className="text-2xl font-bold text-gray-900">{tasks.length}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Est. Hours</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalEstimatedHours.toFixed(1)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Critical Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalCritical}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Clock4 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Overdue Days</p>
            <h3 className="text-2xl font-bold text-gray-900">{aging.averageOverdueDays}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Department Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Department Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Department</th>
                  <th className="px-4 py-3 font-semibold">Tasks</th>
                  <th className="px-4 py-3 font-semibold">Est. Hours</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(byDepartment).map(([dept, deptTasks]) => {
                  const hours = deptTasks.reduce((s, t) => s + t.estimatedDurationHours, 0);
                  const critical = deptTasks.filter(t => t.severity === 'CRITICAL').length;
                  return (
                    <tr key={dept} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{dept}</td>
                      <td className="px-4 py-3 text-gray-600">{deptTasks.length}</td>
                      <td className="px-4 py-3 text-gray-600">{hours.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${critical > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {critical}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Severity Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Severity Distribution
          </h3>
          <div className="space-y-4 mt-6">
            {Object.entries(bySeverity).map(([sev, sevTasks]) => {
              const count = sevTasks.length;
              const percent = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
              const colors = {
                CRITICAL: 'bg-red-500',
                HIGH: 'bg-orange-500',
                MEDIUM: 'bg-amber-400',
                LOW: 'bg-emerald-500'
              };
              return (
                <div key={sev} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{sev}</span>
                    <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${colors[sev as keyof typeof colors]} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Work Type Categorization */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-500" />
          Work Type Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([catName, data]) => (
            <div key={catName} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm mb-2">{catName}</h4>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Tasks</span>
                  <span className="text-xl font-bold text-gray-900">{data.count}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500">Avg Criticality</span>
                  <span className="text-lg font-bold text-amber-600">{data.avgCriticality.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Section-wise Summary Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Section Summary
          </h3>
          <div className="overflow-y-auto max-h-64 pr-2">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Section</th>
                  <th className="px-4 py-3 font-semibold">Tasks</th>
                  <th className="px-4 py-3 font-semibold">Hours</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sectionSummary.map(sec => (
                  <tr key={sec.sectionId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1">{sec.sectionName}</td>
                    <td className="px-4 py-3 text-gray-600">{sec.taskCount}</td>
                    <td className="px-4 py-3 text-gray-600">{sec.totalHours}</td>
                    <td className="px-4 py-3 text-red-600 font-semibold">{sec.criticalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Aging Analysis */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            Aging Analysis (Overdue Days)
          </h3>
          <div className="flex h-48 items-end gap-2 mt-4 justify-between px-4">
            {[
              { label: '0-3 Days', count: aging.overdue0to3, color: 'bg-emerald-400' },
              { label: '4-7 Days', count: aging.overdue4to7, color: 'bg-amber-400' },
              { label: '8-14 Days', count: aging.overdue8to14, color: 'bg-orange-500' },
              { label: '15+ Days', count: aging.overdue15plus, color: 'bg-red-500' },
            ].map(item => {
              const maxCount = Math.max(1, aging.overdue0to3, aging.overdue4to7, aging.overdue8to14, aging.overdue15plus);
              const height = `${(item.count / maxCount) * 100}%`;
              return (
                <div key={item.label} className="flex flex-col items-center w-1/4 group">
                  <div className="text-xs font-bold text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</div>
                  <div className={`w-full max-w-[40px] rounded-t-md ${item.color} transition-all duration-500 min-h-[4px]`} style={{ height }}></div>
                  <div className="text-xs text-gray-500 mt-2 text-center whitespace-nowrap overflow-visible">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. Detailed Task List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-gray-700" />
          Detailed Pending Tasks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-lg">ID</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Dept</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Est. Hrs</th>
                <th className="px-4 py-3 font-semibold rounded-tr-lg">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{t.id}</td>
                  <td className="px-4 py-3 text-gray-700">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{t.department}</td>
                  <td className="px-4 py-3 text-gray-600">{t.sectionName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      t.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      t.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      t.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.estimatedDurationHours}h</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className={`${t.overdueDays > 7 ? 'text-red-600 font-bold' : ''}`}>
                      {t.overdueDays}d
                    </span>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No pending tasks found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
