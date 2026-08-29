'use client';

import React from 'react';
import { OptimizationMetrics } from '../lib/types';
import { 
  TrendingUp, 
  Clock, 
  Layers, 
  AlertTriangle, 
  Zap, 
  ShieldCheck
} from 'lucide-react';

interface MetricsOverviewProps {
  metrics: OptimizationMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric Card 1: Asset Availability */}
      <div className="relative overflow-hidden bg-gray-100/80 border border-gray-200 rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:border-gray-300 transition-all group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="w-16 h-16 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Corridor Uptime
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.assetAvailabilityPercentage}%
          </span>
          <span className="text-xs font-bold text-emerald-400 flex items-center">
            +3.4% vs manual
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Target track availability across all 5 corridor sections
        </p>
      </div>

      {/* Metric Card 2: Downtime Hours Saved */}
      <div className="relative overflow-hidden bg-gray-100/80 border border-gray-200 rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:border-gray-300 transition-all group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-16 h-16 text-amber-400" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Track Downtime Saved
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.downtimeHoursSaved} hrs
          </span>
          <span className="text-xs font-semibold text-gray-500">
            from {metrics.totalBlockHoursRequested}h requested
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Scheduled downtime reduced to {metrics.optimizedBlockHoursScheduled} hrs
        </p>
      </div>

      {/* Metric Card 3: Shadow Block Efficiency */}
      <div className="relative overflow-hidden bg-gray-100/80 border border-gray-200 rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:border-gray-300 transition-all group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Layers className="w-16 h-16 text-cyan-400" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Shadow Block Co-location
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.shadowBlockEfficiency}%
          </span>
          <span className="text-xs font-bold text-cyan-400">
            Multi-Dept Bundle
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {metrics.trainDelaysPreventedMinutes} mins cumulative train delay avoided
        </p>
      </div>

      {/* Metric Card 4: Defect Hazards */}
      <div className="relative overflow-hidden bg-gray-100/80 border border-gray-200 rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:border-gray-300 transition-all group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <AlertTriangle className="w-16 h-16 text-red-400" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Maintenance Queue
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.totalDefects} Tasks
          </span>
          <span className="text-xs font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
            {metrics.criticalTasksCount} Critical
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Integrated across TMS, SMMS, and TDMS databases
        </p>
      </div>
    </div>
  );
};
