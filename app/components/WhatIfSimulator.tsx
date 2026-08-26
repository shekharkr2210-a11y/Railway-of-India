'use client';

import React, { useState } from 'react';
import { WhatIfScenario } from '../lib/types';
import { 
  Sliders, 
  CloudRain, 
  Train, 
  Gauge, 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  AlertTriangle,
  Zap
} from 'lucide-react';

interface WhatIfSimulatorProps {
  onApplyScenario: (scenario: WhatIfScenario) => void;
  isSimulating?: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  onApplyScenario,
  isSimulating = false,
}) => {
  const [monsoonFactor, setMonsoonFactor] = useState<number>(1.0);
  const [freightSurge, setFreightSurge] = useState<number>(0);
  const [speedSensitivity, setSpeedSensitivity] = useState<number>(30);
  const [powerBuffer, setPowerBuffer] = useState<number>(20);

  const handleApply = () => {
    onApplyScenario({
      monsoonWeatherFactor: monsoonFactor,
      freightTrafficSurgePercentage: freightSurge,
      speedRestrictionSensitivity: speedSensitivity,
      powerBlockBufferMinutes: powerBuffer,
    });
  };

  const handlePreset = (preset: 'NORMAL' | 'MONSOON' | 'FREIGHT_SURGE' | 'SAFETY_AUDIT') => {
    let m = 1.0, f = 0, s = 30, p = 20;
    if (preset === 'MONSOON') {
      m = 1.7; f = 25; s = 20; p = 30;
    } else if (preset === 'FREIGHT_SURGE') {
      m = 1.1; f = 80; s = 35; p = 15;
    } else if (preset === 'SAFETY_AUDIT') {
      m = 1.4; f = 10; s = 15; p = 25;
    }
    setMonsoonFactor(m);
    setFreightSurge(f);
    setSpeedSensitivity(s);
    setPowerBuffer(p);

    onApplyScenario({
      monsoonWeatherFactor: m,
      freightTrafficSurgePercentage: f,
      speedRestrictionSensitivity: s,
      powerBlockBufferMinutes: p,
    });
  };

  const isModified = monsoonFactor !== 1.0 || freightSurge !== 0 || speedSensitivity !== 30 || powerBuffer !== 20;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              AI "What-If" Scenario & Network Stress-Testing Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Parameter Modeling
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Simulate operational disruptions, adverse weather conditions, and freight traffic surges to test block schedule resilience.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Quick Presets:</span>
          <button
            onClick={() => handlePreset('NORMAL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
              !isModified ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Normal Baseline
          </button>
          <button
            onClick={() => handlePreset('MONSOON')}
            className="px-3 py-1 rounded-lg font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            Monsoon Flood Risk
          </button>
          <button
            onClick={() => handlePreset('FREIGHT_SURGE')}
            className="px-3 py-1 rounded-lg font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1"
          >
            <Train className="w-3.5 h-3.5 text-amber-600" />
            +80% Freight Surge
          </button>
          <button
            onClick={() => handlePreset('SAFETY_AUDIT')}
            className="px-3 py-1 rounded-lg font-semibold bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Zero-Tolerance Safety
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Slider 1: Monsoon Degradation */}
        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-gray-800 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-600" />
              Monsoon Weather Risk
            </span>
            <span className="font-mono text-blue-700 font-bold">{monsoonFactor.toFixed(1)}x</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">Escalates track geometry & weld defect urgency</p>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.1"
            value={monsoonFactor}
            onChange={e => setMonsoonFactor(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>1.0x (Dry)</span>
            <span>1.5x (Rain)</span>
            <span>2.0x (Flood)</span>
          </div>
        </div>

        {/* Slider 2: Freight Traffic Surge */}
        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-gray-800 flex items-center gap-1.5">
              <Train className="w-4 h-4 text-amber-600" />
              Freight Corridor Surge
            </span>
            <span className="font-mono text-amber-700 font-bold">+{freightSurge}%</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">Crowds available headway windows</p>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={freightSurge}
            onChange={e => setFreightSurge(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>+0% Normal</span>
            <span>+50% High</span>
            <span>+100% Peak</span>
          </div>
        </div>

        {/* Slider 3: Speed Restriction Sensitivity */}
        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-gray-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-600" />
              TSR Penalty Sensitivity
            </span>
            <span className="font-mono text-purple-700 font-bold">{speedSensitivity} km/h</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">Threshold for speed recovery priority</p>
          <input
            type="range"
            min="15"
            max="60"
            step="5"
            value={speedSensitivity}
            onChange={e => setSpeedSensitivity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>15 km/h (Strict)</span>
            <span>30 km/h</span>
            <span>60 km/h</span>
          </div>
        </div>

        {/* Slider 4: Power Block Isolation Buffer */}
        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-gray-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              25kV Isolation Buffer
            </span>
            <span className="font-mono text-emerald-700 font-bold">{powerBuffer} mins</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">OHE discharge rod safety window</p>
          <input
            type="range"
            min="10"
            max="45"
            step="5"
            value={powerBuffer}
            onChange={e => setPowerBuffer(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>10 min</span>
            <span>20 min (Std)</span>
            <span>45 min</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>
            Active Simulation: <strong className="text-gray-900">{monsoonFactor}x Weather</strong>, <strong className="text-gray-900">+{freightSurge}% Freight</strong>, <strong className="text-gray-900">{speedSensitivity} km/h TSR</strong>.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isModified && (
            <button
              onClick={() => handlePreset('NORMAL')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={handleApply}
            disabled={isSimulating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSimulating ? 'Recalculating Network...' : 'Simulate & Re-Optimize Network'}
          </button>
        </div>
      </div>
    </div>
  );
};
