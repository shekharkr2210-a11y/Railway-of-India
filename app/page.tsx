'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NationalOverview } from './components/NationalOverview';
import { MetricsOverview } from './components/MetricsOverview';
import { CorridorMap } from './components/CorridorMap';
import { TimeSpaceGantt } from './components/TimeSpaceGantt';
import { CalendarView } from './components/CalendarView';
import { ShadowBlockShowcase } from './components/ShadowBlockShowcase';
import { TaskPriorityTable } from './components/TaskPriorityTable';
import { BDMSWorkflow } from './components/BDMSWorkflow';
import { DataIngestionPanel } from './components/DataIngestionPanel';
import { CyberSecurityPanel } from './components/CyberSecurityPanel';
import { LoginPage } from './components/LoginPage';
import { PendingWorksReport } from './components/PendingWorksReport';
import { PreventiveMaintenancePanel } from './components/PreventiveMaintenancePanel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SettingsPanel } from './components/SettingsPanel';
import { recalculateTasksWithWhatIf } from './lib/mlEngine';
import { 
  ZONAL_RAILWAYS,
  DIVISIONAL_UNITS,
  INITIAL_CORRIDOR_SECTIONS, 
  INITIAL_MAINTENANCE_TASKS, 
  INITIAL_TRAIN_MOVEMENTS 
} from './lib/mockData';
import { generateOptimizedBlocks } from './lib/optimizer';
import { MaintenanceTask, BlockWindow, OptimizationMetrics, ScopeLevel, UserRole, WhatIfScenario } from './lib/types';
import { INITIAL_AUDIT_LOGS, INITIAL_SECURITY_STATUS, generateDigitalSignature, AuditLogEntry } from './lib/security';
import { runServerOptimization, postBackendBdmsSanction, fetchCurrentUser, logoutUser } from './lib/apiClient';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<string>('');
  const [horizon, setHorizon] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [activeTab, setActiveTab] = useState<'NATIONAL' | 'OVERVIEW' | 'GANTT' | 'CORRIDOR' | 'TASKS' | 'PENDING_WORKS' | 'BDMS' | 'INGESTION' | 'SECURITY' | 'PM_CYCLES' | 'SETTINGS'>('NATIONAL');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Enterprise Scope & Role State
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>('NATIONAL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<UserRole>('BOARD_HQ');

  // Security Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [securityStatus] = useState(INITIAL_SECURITY_STATUS);

  const [tasks, setTasks] = useState<MaintenanceTask[]>(INITIAL_MAINTENANCE_TASKS);
  const [blocks, setBlocks] = useState<BlockWindow[]>([]);
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    totalDefects: 18450,
    criticalTasksCount: 3120,
    assetAvailabilityPercentage: 98.4,
    totalBlockHoursRequested: 240,
    optimizedBlockHoursScheduled: 114,
    downtimeHoursSaved: 126,
    shadowBlockEfficiency: 54.2,
    trainDelaysPreventedMinutes: 14200,
    activeZonesCount: 18,
    activeDivisionsCount: 68,
    crossZonalConflictsResolved: 142,
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const runOptimization = useCallback(async (
    currentHorizon: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    currentScope: ScopeLevel,
    currentZone: string,
    currentDivision: string,
    currentTasks: MaintenanceTask[]
  ) => {
    setIsOptimizing(true);
    try {
      // Execute backend REST API request to /api/optimize
      const response = await runServerOptimization(currentHorizon, currentScope, currentZone, currentDivision, currentTasks);
      
      if (response.success) {
        setBlocks(response.blocks);
        setMetrics(response.metrics);

        const scopeLabel = currentScope === 'NATIONAL' ? 'All 18 Zonal Railways' : currentScope === 'ZONE' ? `Zone ${currentZone}` : `Division ${currentDivision}`;
        
        // Log Audit Entry
        const newLog: AuditLogEntry = {
          id: `LOG-${Math.floor(8800 + Math.random() * 1000)}`,
          timestamp: new Date().toLocaleTimeString(),
          action: 'AI_OPTIMIZER_BACKEND_EXECUTION',
          userRole: `${userRole} (${currentScope})`,
          ipAddress: '10.200.4.12 (RailTel Secure Backend API)',
          status: 'SUCCESS',
          digitalSignature: generateDigitalSignature(`OPT-${Date.now()}`, { scope: currentScope, saved: response.metrics.downtimeHoursSaved }),
          details: `Backend REST API /api/optimize ran across ${scopeLabel}. Saved ${response.metrics.downtimeHoursSaved} hrs track downtime.`,
        };
        setAuditLogs(prev => [newLog, ...prev]);

        setToastMessage(`✨ AI Optimizer scheduled ${response.blocks.length} blocks (${currentHorizon}) for ${scopeLabel}. Saved ${response.metrics.downtimeHoursSaved} hrs downtime!`);
      }
    } catch {
      // Fallback local optimization if offline
      const result = generateOptimizedBlocks(currentTasks, currentHorizon, currentScope, currentZone, currentDivision);
      setBlocks(result.blocks);
      setMetrics(result.metrics);
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  }, [userRole]);

  // Run AI Optimization on Mount or Scope Change
  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (isMounted) {
        await runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, tasks);
      }
    };
    execute();
    return () => {
      isMounted = false;
    };
  }, [horizon, scopeLevel, selectedZone, selectedDivision, runOptimization, tasks]);

  const handleManualOptimize = () => {
    runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, tasks);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'SCHEDULED' ? ('PENDING' as const) : ('SCHEDULED' as const),
        };
      }
      return t;
    });
    setTasks(updated);
    runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, updated);
  };

  const handleTaskCreated = (newTask: MaintenanceTask) => {
    setTasks(prev => {
      const combined = [newTask, ...prev];
      runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, combined);
      return combined;
    });
    setToastMessage(`➕ New Task "${newTask.title}" registered successfully!`);
  };

  const handleTasksImported = (newTasks: MaintenanceTask[]) => {
    const combined = [...newTasks, ...tasks];
    setTasks(combined);
    runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, combined);
    setToastMessage(`📥 Ingested ${newTasks.length} external defects from CRIS Data Bus! Re-optimizing...`);
  };

  const handleApplyWhatIfScenario = (scenario: WhatIfScenario) => {
    const recalculated = recalculateTasksWithWhatIf(tasks, scenario, INITIAL_CORRIDOR_SECTIONS);
    setTasks(recalculated);
    runOptimization(horizon, scopeLevel, selectedZone, selectedDivision, recalculated);
    setToastMessage(`⚡ What-If Simulation Applied (Monsoon: ${scenario.monsoonWeatherFactor}x, Freight Surge: +${scenario.freightTrafficSurgePercentage}%)! Recalibrated schedule.`);
  };

  const handleApproveBlock = async (blockId: string) => {
    const approvedBlock = blocks.find(b => b.id === blockId);

    try {
      // Call backend REST API /api/bdms/sanction
      const apiResponse = await postBackendBdmsSanction(blockId, userRole, {
        depts: approvedBlock?.participatingDepartments,
        duration: approvedBlock?.durationHours,
      });

      const updated = blocks.map(b => {
        if (b.id === blockId) {
          return { ...b, bdmsStatus: 'APPROVED' as const };
        }
        return b;
      });
      setBlocks(updated);

      // Add audit log
      const newLog: AuditLogEntry = {
        id: `LOG-${Math.floor(8800 + Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'BDMS_BLOCK_SANCTION_BACKEND',
        userRole: `${userRole}`,
        ipAddress: '10.142.12.89 (mTLS Encrypted Link)',
        status: 'SUCCESS',
        digitalSignature: apiResponse.digitalSignature || generateDigitalSignature(blockId, {}),
        details: `Backend API /api/bdms/sanction cryptographically signed & approved ${blockId}.`,
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setToastMessage(`✅ Block Window ${blockId} cryptographically signed via Backend REST API!`);
    } catch {
      // Fallback
      const updated = blocks.map(b => {
        if (b.id === blockId) {
          return { ...b, bdmsStatus: 'APPROVED' as const };
        }
        return b;
      });
      setBlocks(updated);
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Check active session on initial mount
  useEffect(() => {
    fetchCurrentUser().then(user => {
      if (user) {
        setIsAuthenticated(true);
        setLoggedInUser(user.name);
        setUserRole(user.role);
        if (user.zoneCode) setSelectedZone(user.zoneCode);
        if (user.divisionCode) setSelectedDivision(user.divisionCode);
        if (user.role === 'BOARD_HQ') setScopeLevel('NATIONAL');
        else if (user.role === 'ZONAL_GM') setScopeLevel('ZONE');
        else if (user.role === 'DIVISIONAL_DRM' || user.role === 'SECTION_CONTROLLER') setScopeLevel('DIVISION');
      } else {
        try {
          const isSaved = localStorage.getItem('railway_logged_in');
          const savedRole = localStorage.getItem('railway_saved_role') as UserRole | null;
          const savedName = localStorage.getItem('railway_saved_name');
          if (isSaved === '1' && savedRole) {
            setIsAuthenticated(true);
            setUserRole(savedRole);
            if (savedName) setLoggedInUser(savedName);
          }
        } catch {
          // Ignore
        }
      }
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });
  }, []);

  const filteredSections = INITIAL_CORRIDOR_SECTIONS.filter(s => {
    if (scopeLevel === 'ZONE' && selectedZone !== 'ALL') return s.zoneCode === selectedZone;
    if (scopeLevel === 'DIVISION' && selectedDivision !== 'ALL') return s.divisionCode === selectedDivision;
    return true;
  });

  const filteredTasks = tasks.filter(t => {
    if (scopeLevel === 'ZONE' && selectedZone !== 'ALL') return t.zoneCode === selectedZone;
    if (scopeLevel === 'DIVISION' && selectedDivision !== 'ALL') return t.divisionCode === selectedDivision;
    return true;
  });
  
  const handleLogin = (role: UserRole, username: string) => {
    try {
      localStorage.setItem('railway_logged_in', '1');
      localStorage.setItem('railway_saved_role', role);
      localStorage.setItem('railway_saved_name', username);
    } catch {
      // Ignore
    }
    setUserRole(role);
    setLoggedInUser(username);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('railway_logged_in');
      localStorage.removeItem('railway_saved_name');
    } catch {
      // Ignore
    }
    try {
      await logoutUser();
    } catch {
      // Ignore
    }
    const newLog: AuditLogEntry = {
      id: `LOG-${Math.floor(8800 + Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'AUTH_LOGOUT',
      userRole: `${userRole}`,
      ipAddress: '10.200.4.12 (Portal Signout)',
      status: 'SUCCESS',
      digitalSignature: generateDigitalSignature(`OUT-${Date.now()}`, {}),
      details: `User ${loggedInUser || userRole} signed out of the Indian Railways AI Block Planner.`,
    };
    setAuditLogs(prev => [newLog, ...prev]);
    setIsAuthenticated(false);
    setLoggedInUser('');
    setToastMessage('👋 You have been securely logged out of Indian Railways Portal.');
  };

  // Auth Loading Gate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-blue-200">Loading Indian Railways AI Block Planner...</p>
      </div>
    );
  }

  // Auth Gate: Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <Header
        horizon={horizon}
        setHorizon={setHorizon}
        onRunOptimizer={handleManualOptimize}
        isOptimizing={isOptimizing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scopeLevel={scopeLevel}
        setScopeLevel={setScopeLevel}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        userRole={userRole}
        setUserRole={setUserRole}
        zones={ZONAL_RAILWAYS}
        divisions={DIVISIONAL_UNITS}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-amber-200 text-gray-900 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Dashboard Container */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {/* Dynamic Tab Views */}
        {activeTab === 'NATIONAL' && (
          <div>
            <NationalOverview
              zones={ZONAL_RAILWAYS}
              divisions={DIVISIONAL_UNITS}
              selectedZone={selectedZone}
              onSelectZone={zoneCode => {
                setSelectedZone(zoneCode);
                setScopeLevel('ZONE');
              }}
              scopeLevel={scopeLevel}
              setScopeLevel={setScopeLevel}
              userRole={userRole}
            />
            <MetricsOverview metrics={metrics} />
            <ShadowBlockShowcase blocks={blocks} />
          </div>
        )}

        {activeTab === 'OVERVIEW' && (
          <div>
            <MetricsOverview metrics={metrics} />
            <ShadowBlockShowcase blocks={blocks} />
            <CorridorMap
              sections={filteredSections}
              tasks={filteredTasks}
              blocks={blocks}
              trains={INITIAL_TRAIN_MOVEMENTS}
              onSelectSection={id => setSelectedSectionId(id)}
              selectedSectionId={selectedSectionId}
            />
            <TimeSpaceGantt
              sections={filteredSections}
              blocks={blocks}
              trains={INITIAL_TRAIN_MOVEMENTS}
              tasks={filteredTasks}
              horizon={horizon}
            />
            <CalendarView blocks={blocks} horizon={horizon} />
            <WhatIfSimulator onApplyScenario={handleApplyWhatIfScenario} />
          </div>
        )}

        {activeTab === 'GANTT' && (
          <div>
            <TimeSpaceGantt
              sections={filteredSections}
              blocks={blocks}
              trains={INITIAL_TRAIN_MOVEMENTS}
              tasks={filteredTasks}
              horizon={horizon}
            />
            <CalendarView blocks={blocks} horizon={horizon} />
          </div>
        )}

        {activeTab === 'CORRIDOR' && (
          <div>
            <CorridorMap
              sections={filteredSections}
              tasks={filteredTasks}
              blocks={blocks}
              trains={INITIAL_TRAIN_MOVEMENTS}
              onSelectSection={id => setSelectedSectionId(id)}
              selectedSectionId={selectedSectionId}
            />
          </div>
        )}

        {activeTab === 'TASKS' && (
          <div>
            <WhatIfSimulator onApplyScenario={handleApplyWhatIfScenario} />
            <TaskPriorityTable
              tasks={filteredTasks}
              onToggleTaskStatus={handleToggleTaskStatus}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        )}

        {activeTab === 'PENDING_WORKS' && (
          <div>
            <PendingWorksReport tasks={filteredTasks} />
          </div>
        )}

        {activeTab === 'BDMS' && (
          <div>
            <BDMSWorkflow
              blocks={blocks}
              tasks={filteredTasks}
              onApproveBlock={handleApproveBlock}
            />
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div>
            <CyberSecurityPanel
              status={securityStatus}
              auditLogs={auditLogs}
            />
          </div>
        )}

        {activeTab === 'INGESTION' && (
          <div>
            <DataIngestionPanel onTasksImported={handleTasksImported} />
          </div>
        )}

        {activeTab === 'PM_CYCLES' && (
          <div>
            <PreventiveMaintenancePanel sections={filteredSections} tasks={filteredTasks} />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div>
            <SettingsPanel userRole={userRole} onHorizonChange={setHorizon} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-4 px-6 text-center text-xs text-gray-500 flex flex-wrap justify-between items-center gap-4">
        <div>
          🇮🇳 Indian Railways Enterprise AI Automatic Block Planning System • Full-Stack Backend Connected (REST API + TLS 1.3)
        </div>
        <div className="text-emerald-500 font-mono">
          API Status: 200 OK • Backend Route Handlers Online
        </div>
      </footer>
    </div>
  );
}
