'use client';

import React from 'react';
import { BlockWindow } from '../lib/types';
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

interface ShadowBlockShowcaseProps {
  blocks?: BlockWindow[];
}

export const ShadowBlockShowcase: React.FC<ShadowBlockShowcaseProps> = ({ blocks = [] }) => {
  const shadowBlocks = blocks.filter(b => b.isShadowBlock);
  const totalSaved = shadowBlocks.reduce((acc, b) => acc + (b.downtimeSavedHours || 0), 0);
  const sampleShadowBlock = shadowBlocks[0];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl relative overflow-hidden">
      {/* Glow Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Core Innovation
            </span>
            <span className="text-xs font-semibold text-gray-500">
              Multi-Department Co-Location Algorithm
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            How AI Shadow Blocking Transforms Indian Railways Operations
          </h2>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Corridor Downtime Saved</div>
          <div className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {totalSaved > 0 ? `+${totalSaved.toFixed(1)} hrs Saved (-53%)` : '-53% Track Closure Reduction'}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Left: Traditional Uncoordinated Process */}
        <div className="bg-white/70 border border-red-500/20 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Before AI (Traditional Manual BDMS)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              6.0 Hours Total Track Downtime
            </span>
          </div>

          {/* Sequential Timeline Blocks */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
              <div className="flex justify-between font-semibold text-blue-300 mb-1">
                <span>1. Engineering Track Relay (TMS)</span>
                <span>2.5 Hours (08:00 - 10:30)</span>
              </div>
              <p className="text-[11px] text-gray-500">Track blocked independently. S&T and OHE teams wait.</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
              <div className="flex justify-between font-semibold text-purple-300 mb-1">
                <span>2. TRD OHE Wire Inspection (TDMS)</span>
                <span>2.0 Hours (12:00 - 14:00)</span>
              </div>
              <p className="text-[11px] text-gray-500">Power block taken separately. Track blocked again.</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
              <div className="flex justify-between font-semibold text-emerald-300 mb-1">
                <span>3. S&T Point Machine Overhaul (SMMS)</span>
                <span>1.5 Hours (16:00 - 17:30)</span>
              </div>
              <p className="text-[11px] text-gray-500">Third track disconnection of the day. Disrupts goods trains.</p>
            </div>
          </div>
        </div>

        {/* Right: AI-Optimized Shadow Block */}
        <div className="bg-white/95 border border-emerald-500/40 rounded-xl p-5 relative shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                After AI (Unified Shadow Block)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ✨ {sampleShadowBlock ? `${sampleShadowBlock.durationHours} Hours Single Window` : '2.8 Hours Single Window'}
            </span>
          </div>

          {/* Unified Combined Block Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 text-xs space-y-3">
            <div className="flex items-center justify-between font-bold text-gray-900 text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Co-Located Window ({sampleShadowBlock ? `${sampleShadowBlock.startTime} - ${sampleShadowBlock.endTime}` : '11:30 - 14:18'})
              </span>
              <span className="text-emerald-400 font-mono text-xs">Single Track Closure</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
              <div className="p-2 rounded bg-gray-100/80 border border-blue-500/30 text-[11px]">
                <div className="font-bold text-blue-300">Civil Eng (TMS)</div>
                <div className="text-[10px] text-gray-500">Track Relay (KM 10-12)</div>
              </div>
              <div className="p-2 rounded bg-gray-100/80 border border-purple-500/30 text-[11px]">
                <div className="font-bold text-purple-300">TRD (TDMS)</div>
                <div className="text-[10px] text-gray-500">25kV OHE Isolation</div>
              </div>
              <div className="p-2 rounded bg-gray-100/80 border border-emerald-500/30 text-[11px]">
                <div className="font-bold text-emerald-300">S&T (SMMS)</div>
                <div className="text-[10px] text-gray-500">Point Machine Scan</div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-gray-700 flex items-center justify-between bg-gray-50/90 p-2.5 rounded-lg border border-gray-200">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Net Benefit: {sampleShadowBlock?.downtimeSavedHours || 3.2} Hours Saved
              </span>
              <span className="text-gray-500">Safety Headway Maintained</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
