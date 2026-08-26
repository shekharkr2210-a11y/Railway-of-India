'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  RefreshCw,
  Train,
  CheckCircle2,
  Globe,
  Building2,
  UserCheck,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  User,
  LogIn
} from 'lucide-react';
import { ScopeLevel, UserRole, ZonalRailway, DivisionalUnit } from '../lib/types';

interface HeaderProps {
  horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  setHorizon: (horizon: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  onRunOptimizer: () => void;
  isOptimizing: boolean;
  activeTab: 'NATIONAL' | 'OVERVIEW' | 'GANTT' | 'CORRIDOR' | 'TASKS' | 'BDMS' | 'INGESTION' | 'SECURITY';
  setActiveTab: (tab: 'NATIONAL' | 'OVERVIEW' | 'GANTT' | 'CORRIDOR' | 'TASKS' | 'BDMS' | 'INGESTION' | 'SECURITY') => void;
  scopeLevel: ScopeLevel;
  setScopeLevel: (scope: ScopeLevel) => void;
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  selectedDivision: string;
  setSelectedDivision: (division: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  zones: ZonalRailway[];
  divisions: DivisionalUnit[];
}

export const Header: React.FC<HeaderProps> = ({
  horizon,
  setHorizon,
  onRunOptimizer,
  isOptimizing,
  activeTab,
  setActiveTab,
  scopeLevel,
  setScopeLevel,
  selectedZone,
  setSelectedZone,
  selectedDivision,
  setSelectedDivision,
  userRole,
  setUserRole,
  zones,
  divisions,
}) => {
  // Filter divisions to only show those belonging to the selected Zone (or all if ALL is selected)
  const availableDivisions = selectedZone === 'ALL'
    ? divisions
    : divisions.filter(d => d.zoneCode === selectedZone);

  const handleZoneSelect = (zoneCode: string) => {
    setSelectedZone(zoneCode);
    if (zoneCode === 'ALL') {
      setScopeLevel('NATIONAL');
      setSelectedDivision('ALL');
      setActiveTab('NATIONAL');
    } else {
      setScopeLevel('ZONE');
      // Auto-select first division of that zone if division was invalid
      const zoneDivs = divisions.filter(d => d.zoneCode === zoneCode);
      if (zoneDivs.length > 0 && !zoneDivs.some(d => d.code === selectedDivision)) {
        setSelectedDivision(zoneDivs[0].code);
      }
    }
  };

  const handleDivisionSelect = (divCode: string) => {
    setSelectedDivision(divCode);
    if (divCode === 'ALL') {
      setScopeLevel(selectedZone === 'ALL' ? 'NATIONAL' : 'ZONE');
    } else {
      setScopeLevel('DIVISION');
      // Auto-update zone dropdown to match division's parent zone
      const divObj = divisions.find(d => d.code === divCode);
      if (divObj) {
        setSelectedZone(divObj.zoneCode);
      }
      // Instantly switch view tab to Division KPI Overview so user sees full schedule & corridor
      setActiveTab('OVERVIEW');
    }
  };

  const handleScopeButtonClick = (newScope: ScopeLevel) => {
    setScopeLevel(newScope);
    if (newScope === 'NATIONAL') {
      setSelectedZone('ALL');
      setSelectedDivision('ALL');
      setActiveTab('NATIONAL');
    } else if (newScope === 'ZONE') {
      if (selectedZone === 'ALL') setSelectedZone('NER');
      setActiveTab('NATIONAL');
    } else if (newScope === 'DIVISION') {
      if (selectedDivision === 'ALL') setSelectedDivision('LJN');
      setActiveTab('OVERVIEW');
    }
  };

  // Role-switch authentication modal state
  const [showRoleAuthModal, setShowRoleAuthModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const ROLE_LABELS: Record<UserRole, string> = {
    BOARD_HQ: 'Railway Board HQ Director',
    ZONAL_GM: 'Zonal General Manager (GM)',
    DIVISIONAL_DRM: 'Divisional Manager (DRM)',
    SECTION_CONTROLLER: 'Section Traffic Controller',
  };

  const handleRoleChangeRequest = (newRole: UserRole) => {
    if (newRole === userRole) return;
    setPendingRole(newRole);
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthError(null);
    setAuthShowPassword(false);
    setShowRoleAuthModal(true);
  };

  const handleRoleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authName.trim()) { setAuthError('Full name is required'); return; }
    if (!authEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim())) {
      setAuthError('Valid email address is required'); return;
    }
    if (!authPassword || authPassword.length < 4) {
      setAuthError('Password must be at least 4 characters'); return;
    }

    setAuthLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (pendingRole) {
      setUserRole(pendingRole);
    }
    setAuthLoading(false);
    setShowRoleAuthModal(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 text-gray-900">
      {/* Scope & Role Bar */}
      <div className="px-6 py-2 bg-gray-50/90 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Scope Level Selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            Network Scope:
          </span>

          <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center gap-1">
            <button
              onClick={() => handleScopeButtonClick('NATIONAL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                scopeLevel === 'NATIONAL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              🇮🇳 National (All India)
            </button>
            <button
              onClick={() => handleScopeButtonClick('ZONE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                scopeLevel === 'ZONE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Zonal Railway
            </button>
            <button
              onClick={() => handleScopeButtonClick('DIVISION')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                scopeLevel === 'DIVISION'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Division
            </button>
          </div>

          {/* Zone Dropdown */}
          {scopeLevel !== 'NATIONAL' && (
            <select
              value={selectedZone}
              onChange={e => handleZoneSelect(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none focus:border-amber-500 font-semibold shadow-sm shadow-amber-500/10"
            >
              <option value="ALL">All 18 Zones</option>
              {zones.map(z => (
                <option key={z.code} value={z.code}>
                  {z.code} - {z.name}
                </option>
              ))}
            </select>
          )}

          {/* Division Dropdown (Filtered by parent Zone) */}
          {scopeLevel === 'DIVISION' && (
            <select
              value={selectedDivision}
              onChange={e => handleDivisionSelect(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-emerald-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-sm shadow-emerald-500/10"
            >
              <option value="ALL">All Divisions</option>
              {availableDivisions.map(d => (
                <option key={d.code} value={d.code}>
                  {d.code} ({d.zoneCode}) - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* User Persona Switcher & Security Status */}
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            TLS 1.3 mTLS Secured
          </span>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Persona Role:
            </span>
            <select
              value={userRole}
              onChange={e => handleRoleChangeRequest(e.target.value as UserRole)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-emerald-700 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="BOARD_HQ">Railway Board HQ Director</option>
              <option value="ZONAL_GM">Zonal General Manager (GM)</option>
              <option value="DIVISIONAL_DRM">Divisional Manager (DRM)</option>
              <option value="SECTION_CONTROLLER">Section Traffic Controller</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Branding Header */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Train className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                INDIAN RAILWAYS • NATIONAL AI BLOCK PLANNER
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Hardened & Encrypted
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Multi-Zone Enterprise Block Optimization • Scope:{' '}
              <span className="text-amber-400 font-semibold">
                {scopeLevel === 'NATIONAL' ? 'ALL INDIA (18 ZONES)' : scopeLevel === 'ZONE' ? `ZONE: ${selectedZone}` : `DIVISION: ${selectedDivision}`}
              </span>
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Horizon Selector */}
          <div className="bg-gray-50/90 p-1 rounded-xl border border-gray-200 flex items-center gap-1">
            <button
              onClick={() => setHorizon('DAILY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                horizon === 'DAILY'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
              }`}
            >
              Daily Dynamic
            </button>
            <button
              onClick={() => setHorizon('WEEKLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                horizon === 'WEEKLY'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
              }`}
            >
              Weekly Tactical
            </button>
            <button
              onClick={() => setHorizon('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                horizon === 'MONTHLY'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
              }`}
            >
              Monthly Macro
            </button>
          </div>

          {/* Run Optimizer Button */}
          <button
            onClick={onRunOptimizer}
            disabled={isOptimizing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                Optimizing Network...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                Run AI Shadow Optimizer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 flex items-center gap-2 overflow-x-auto text-xs font-medium border-t border-gray-200/40 py-2">
        <button
          onClick={() => setActiveTab('NATIONAL')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'NATIONAL'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          National HQ Dashboard
        </button>

        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Division KPI Overview
        </button>

        <button
          onClick={() => setActiveTab('GANTT')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'GANTT'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Time-Space Gantt Planner
        </button>

        <button
          onClick={() => setActiveTab('CORRIDOR')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'CORRIDOR'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Linear Track Visualizer
        </button>

        <button
          onClick={() => setActiveTab('TASKS')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'TASKS'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          TMS/SMMS/TDMS Tasks
        </button>

        <button
          onClick={() => setActiveTab('BDMS')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'BDMS'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          BDMS Approval Workflow
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'SECURITY'
              ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Cybersecurity SOC Panel
        </button>

        <button
          onClick={() => setActiveTab('INGESTION')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'INGESTION'
              ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Live Ingestion Feeds
        </button>
      </div>

      {/* Role-Switch Authentication Modal */}
      {showRoleAuthModal && pendingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white">Role Authentication Required</h3>
              </div>
              <p className="text-xs text-blue-200">
                Switching to: <span className="font-bold text-white">{ROLE_LABELS[pendingRole]}</span>
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRoleAuthSubmit} className="px-6 py-5 space-y-3.5">
              {authError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={authName}
                    onChange={e => { setAuthName(e.target.value); setAuthError(null); }}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={e => { setAuthEmail(e.target.value); setAuthError(null); }}
                    placeholder="you@indianrailways.gov.in"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={authShowPassword ? 'text' : 'password'}
                    value={authPassword}
                    onChange={e => { setAuthPassword(e.target.value); setAuthError(null); }}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAuthShowPassword(!authShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {authShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleAuthModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      Authenticate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
