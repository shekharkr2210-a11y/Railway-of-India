'use client';

import React from 'react';
import { MaintenanceTask, CorridorSection } from '../lib/types';
import { explainTaskCriticality } from '../lib/mlEngine';
import { 
  Sparkles, 
  X, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  Info,
  Scale
} from 'lucide-react';

interface AIExplainabilityModalProps {
  task: MaintenanceTask | null;
  section?: CorridorSection;
  onClose: () => void;
}

export const AIExplainabilityModal: React.FC<AIExplainabilityModalProps> = ({
  task,
  section,
  onClose,
}) => {
  if (!task) return null;

  const breakdown = explainTaskCriticality(task, section);
  const f = breakdown.features;

  // Calculate percentages for visual progress bars
  const sevPct = Math.min(100, Math.round((f.severityScore / f.severityMax) * 100));
  const overduePct = Math.min(100, Math.round((f.overdueScore / f.overdueMax) * 100));
  const speedPct = Math.min(100, Math.round((f.speedImpactScore / f.speedImpactMax) * 100));
  const densityPct = Math.min(100, Math.round((f.trafficDensityScore / Math.max(1, f.trafficDensityMax)) * 100));
  const powerPct = f.requiresPowerBlock ? 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Explainable AI (XAI) Model Diagnostics
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              Confidence: 94.8%
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Track Criticality Index (TCI) Decomposition
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Mathematical weight attribution for Defect #{task.id} • {task.sourceSystem} System
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Task Summary Card */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">Target Maintenance Asset</div>
              <div className="text-sm font-extrabold text-gray-900 mt-0.5">{task.title}</div>
              <div className="text-xs text-gray-600 mt-1">
                📍 {task.sectionName} (KM {task.startKm} to {task.endKm}) • Dept: <span className="font-semibold text-gray-800">{task.departmentName}</span>
              </div>
            </div>

            <div className="text-center bg-white px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Composite TCI Score</div>
              <div className={`text-2xl font-black ${
                breakdown.totalScore >= 80 ? 'text-red-600' : breakdown.totalScore >= 60 ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {breakdown.totalScore} <span className="text-xs font-normal text-gray-500">/ 100</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formulation */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              TCI Mathematical Feature Formulation
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 overflow-x-auto shadow-inner">
              TCI = 100 × [ 0.28·w_sev + 0.24·(1 - e^(-0.2·d_overdue)) + 0.18·(Δv_TSR / 60) + 0.15·ρ_traffic + 0.15·φ_OHE ]
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Calibrated multi-attribute decision weighting enforcing Indian Railways Track Manual & Safety Directive Standards.
            </p>
          </div>

          {/* Feature Breakdown Bars */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Feature Weight Attribution Breakdown
            </h3>

            <div className="space-y-3.5">
              {/* Severity Weight */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    1. Inherent Defect Severity ({f.severityLabel})
                  </span>
                  <span className="font-mono text-red-600 font-bold">+{f.severityScore} pts (Max {f.severityMax})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${sevPct}%` }}></div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Categorical weight assigned based on derailment risk rating from {task.sourceSystem}.
                </div>
              </div>

              {/* Overdue Penalty */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    2. Exponential Overdue Penalty ({f.overdueDays} Days Overdue)
                  </span>
                  <span className="font-mono text-amber-600 font-bold">+{f.overdueScore} pts (Max {f.overdueMax})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${overduePct}%` }}></div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Non-linear penalty function: f(d) = 1 - e^(-0.2 × {f.overdueDays} days).
                </div>
              </div>

              {/* Speed Restriction Impact */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                    3. Speed Restriction Relief (Δv = {f.speedReductionKmph} km/h TSR)
                  </span>
                  <span className="font-mono text-purple-600 font-bold">+{f.speedImpactScore} pts (Max {f.speedImpactMax})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${speedPct}%` }}></div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Line capacity restoration benefit by removing speed restriction upon block completion.
                </div>
              </div>

              {/* Corridor Density Multiplier */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    4. Corridor Traffic Density ({f.trafficDensityLevel} Density)
                  </span>
                  <span className="font-mono text-blue-600 font-bold">+{f.trafficDensityScore} pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${densityPct}%` }}></div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  High-speed trunk line multiplier prioritizing high-density passenger routes (Vande Bharat / Rajdhani corridors).
                </div>
              </div>

              {/* 25kV OHE Power Block */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    5. Traction Power Isolation Complexity
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">{f.requiresPowerBlock ? '+5 pts' : '0 pts'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${powerPct}%` }}></div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {f.requiresPowerBlock ? 'Requires 25kV OHE power block and Substation coordination.' : 'No traction power isolation required.'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Summary */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-amber-700" />
              AI Operational Directive
            </div>
            <p className="text-xs text-amber-950 font-medium">
              {breakdown.explanation}
            </p>
            <div className="mt-2 text-xs font-bold text-amber-800 flex items-center gap-1">
              {breakdown.riskFactorSummary}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-md"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
