'use client';

import React, { useState } from 'react';
import { CorridorSection } from '../lib/types';
import { predictFreightForSection, SectionFreightForecast } from '../lib/forecastEngine';
import { 
  Train, 
  Clock, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Radio
} from 'lucide-react';

interface GoodsTrainForecastPanelProps {
  sections: CorridorSection[];
}

export const GoodsTrainForecastPanel: React.FC<GoodsTrainForecastPanelProps> = ({ sections }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || 'SEC-03');
  const [surgePercentage, setSurgePercentage] = useState<number>(0);

  const selectedSection = sections.find(s => s.id === selectedSectionId) || sections[0];
  const forecast: SectionFreightForecast = predictFreightForSection(
    selectedSection?.id || 'SEC-03',
    new Date().toISOString().split('T')[0],
    surgePercentage,
    sections
  );

  return (
    <div className="space-y-6 mb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                CONTROL OFFICE APPLICATION (COA)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                GOODS-TRAIN FORECAST FEED ACTIVE
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Real-Time Freight Rake Density & Siding Occupancy Forecast
            </h2>
            <p className="text-xs text-amber-200/80 mt-1">
              Time-series forecasting of freight goods rakes feeding soft constraints into the automatic block optimizer
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <div className="text-amber-200 text-[10px] uppercase font-bold">Predicted Rakes</div>
              <div className="text-base font-extrabold text-amber-400">{forecast.totalPredictedRakes} Rakes/Day</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <div className="text-amber-200 text-[10px] uppercase font-bold">Dominant Commodity</div>
              <div className="text-base font-extrabold text-emerald-400">{forecast.dominantCargoType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Selector & Surge Slider */}
      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Corridor Section:</span>
          <select
            value={selectedSectionId}
            onChange={e => setSelectedSectionId(e.target.value)}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-amber-500"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Freight Traffic Surge:
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={surgePercentage}
            onChange={e => setSurgePercentage(Number(e.target.value))}
            className="w-32 accent-amber-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            +{surgePercentage}%
          </span>
        </div>
      </div>

      {/* Time Slot Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forecast.timeSlots.map(slot => {
          const isCongested = slot.congestionLevel === 'CONGESTED';
          const isHigh = slot.congestionLevel === 'HIGH';

          return (
            <div 
              key={slot.timeSlot}
              className={`p-5 rounded-2xl border transition-all shadow-sm ${
                isCongested ? 'bg-red-50/50 border-red-200' :
                isHigh ? 'bg-amber-50/50 border-amber-200' :
                'bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {slot.timeSlot}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCongested ? 'bg-red-100 text-red-800' :
                  isHigh ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {slot.congestionLevel}
                </span>
              </div>

              <div className="text-2xl font-extrabold text-gray-900 mb-1">
                {slot.predictedRakes} <span className="text-xs font-medium text-gray-500">Rakes</span>
              </div>

              <div className="pt-2 border-t border-gray-200/60 mt-3 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Block Feasibility:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  slot.recommendedForMaintenance ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {slot.recommendedForMaintenance ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Optimal Gap
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Freight Penalty
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
