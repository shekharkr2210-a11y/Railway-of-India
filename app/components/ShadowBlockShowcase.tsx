'use client';

import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  XCircle
} from 'lucide-react';

export const ShadowBlockShowcase: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl relative overflow-hidden">
      {/* Glow Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Core Innovation
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Multi-Department Co-Location Algorithm
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            How AI Shadow Blocking Transforms Indian Railways Operations
          </h2>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Corridor Downtime Saved</div>
          <div className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            -53% Track Closure Reduction
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Left: Traditional Uncoordinated Process */}
        <div className="bg-slate-950/70 border border-red-500/20 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Before AI (Traditional Manual BDMS)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              6.0 Hours Total Track Downtime
            </span>
          </div>

          {/* Sequential Timeline Blocks */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex justify-between font-semibold text-blue-300 mb-1">
                <span>1. Engineering Track Relay (TMS)</span>
                <span>2.5 Hours (08:00 - 10:30)</span>
              </div>
              <p className="text-[11px] text-slate-400">Track blocked independently. S&T and OHE teams wait.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex justify-between font-semibold text-purple-300 mb-1">
                <span>2. TRD OHE Wire Inspection (TDMS)</span>
                <span>2.0 Hours (12:00 - 14:00)</span>
              </div>
              <p className="text-[11px] text-slate-400">Power block taken separately. Track blocked again.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex justify-between font-semibold text-emerald-300 mb-1">
                <span>3. S&T Point Machine Overhaul (SMMS)</span>
                <span>1.5 Hours (16:00 - 17:30)</span>
              </div>
              <p className="text-[11px] text-slate-400">Third track disconnection of the day. Disrupts goods trains.</p>
            </div>
          </div>
        </div>

        {/* Right: AI-Optimized Shadow Block */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-5 relative shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                After AI (Unified Shadow Block)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ✨ 2.8 Hours Single Window
            </span>
          </div>

          {/* Unified Combined Block Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 text-xs space-y-3">
            <div className="flex items-center justify-between font-bold text-white text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Co-Located Shadow Window (11:30 - 14:18)
              </span>
              <span className="text-emerald-400 font-mono text-xs">Single Track Closure</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
              <div className="p-2 rounded bg-slate-900/80 border border-blue-500/30 text-[11px]">
                <div className="font-bold text-blue-300">Civil Eng (TMS)</div>
                <div className="text-[10px] text-slate-400">Track Relay</div>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-purple-500/30 text-[11px]">
                <div className="font-bold text-purple-300">TRD (TDMS)</div>
                <div className="text-[10px] text-slate-400">OHE Power Block</div>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-emerald-500/30 text-[11px]">
                <div className="font-bold text-emerald-300">S&T (SMMS)</div>
                <div className="text-[10px] text-slate-400">Point Calibration</div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-300 flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Net Benefit: 3.2 Hours Track Downtime Saved
              </span>
              <span className="text-slate-400">Safety Headway Maintained</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
