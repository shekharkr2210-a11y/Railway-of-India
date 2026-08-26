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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
          <div className="text-xs text-gray-500 font-semibold uppercase">Corridor Downtime Saved</div>
          <div className="text-xl font-extrabold text-emerald-600">
            {totalSaved > 0 ? `+${totalSaved.toFixed(1)} hrs Saved (-53%)` : '-53% Track Closure Reduction'}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Left: Traditional Uncoordinated Process */}
        <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-red-950 uppercase tracking-wider">
                Before AI (Traditional Manual BDMS)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
              6.0 Hours Total Track Downtime
            </span>
          </div>

          {/* Sequential Timeline Blocks */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white border border-red-200 text-xs shadow-xs">
              <div className="flex justify-between font-semibold text-blue-900 mb-1">
                <span>1. Engineering Track Relay (TMS)</span>
                <span className="font-mono text-gray-600">2.5 Hours (08:00 - 10:30)</span>
              </div>
              <p className="text-[11px] text-gray-500">Track blocked independently. S&T and OHE teams wait.</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-red-200 text-xs shadow-xs">
              <div className="flex justify-between font-semibold text-purple-900 mb-1">
                <span>2. TRD OHE Wire Inspection (TDMS)</span>
                <span className="font-mono text-gray-600">2.0 Hours (12:00 - 14:00)</span>
              </div>
              <p className="text-[11px] text-gray-500">Power block taken separately. Track blocked again.</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-red-200 text-xs shadow-xs">
              <div className="flex justify-between font-semibold text-emerald-900 mb-1">
                <span>3. S&T Point Machine Overhaul (SMMS)</span>
                <span className="font-mono text-gray-600">1.5 Hours (16:00 - 17:30)</span>
              </div>
              <p className="text-[11px] text-gray-500">Third track disconnection of the day. Disrupts goods trains.</p>
            </div>
          </div>
        </div>

        {/* Right: AI-Optimized Shadow Block */}
        <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-5 relative shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                After AI (Unified Shadow Block)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              ✨ {sampleShadowBlock ? `${sampleShadowBlock.durationHours} Hours Single Window` : '2.8 Hours Single Window'}
            </span>
          </div>

          {/* Unified Combined Block Card */}
          <div className="p-4 rounded-xl bg-white border border-emerald-300 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between font-bold text-gray-900 text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Co-Located Window ({sampleShadowBlock ? `${sampleShadowBlock.startTime} - ${sampleShadowBlock.endTime}` : '11:30 - 14:18'})
              </span>
              <span className="text-emerald-700 font-mono text-xs font-bold">Single Track Closure</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100">
              <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[11px]">
                <div className="font-bold text-blue-900">Civil Eng (TMS)</div>
                <div className="text-[10px] text-gray-600">Track Relay (KM 10-12)</div>
              </div>
              <div className="p-2 rounded bg-purple-50 border border-purple-200 text-[11px]">
                <div className="font-bold text-purple-900">TRD (TDMS)</div>
                <div className="text-[10px] text-gray-600">25kV OHE Isolation</div>
              </div>
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px]">
                <div className="font-bold text-emerald-900">S&T (SMMS)</div>
                <div className="text-[10px] text-gray-600">Point Machine Scan</div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-gray-700 flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Net Benefit: {sampleShadowBlock?.downtimeSavedHours || 3.2} Hours Track Closure Saved
              </span>
              <span className="text-emerald-700 font-semibold">Headways Respected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
