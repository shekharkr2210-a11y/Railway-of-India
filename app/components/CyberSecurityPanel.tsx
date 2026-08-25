'use client';

import React from 'react';
import { AuditLogEntry, SecurityStatus } from '../lib/security';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Radio, 
  Cpu, 
  Activity,
  FileCode2,
  XCircle,
  Eye
} from 'lucide-react';

interface CyberSecurityPanelProps {
  status: SecurityStatus;
  auditLogs: AuditLogEntry[];
}

export const CyberSecurityPanel: React.FC<CyberSecurityPanelProps> = ({
  status,
  auditLogs,
}) => {
  return (
    <div className="space-y-6 mb-6">
      {/* Security Operations Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                CYBERSECURITY OPERATIONS CENTER (SOC)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                ZERO TRUST ARCHITECTURE ACTIVE
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Critical National Infrastructure Defense & Anti-Tamper Protection
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hardened against DDoS attacks, SQL/XSS injections, unauthorized block tampering & insider threats
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Threats Blocked</div>
              <div className="text-base font-extrabold text-emerald-400">{status.activeThreatsBlockedCount} Attacks</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Crypto Signatures</div>
              <div className="text-base font-extrabold text-cyan-400">HMAC-SHA256</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Defense Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WAF DDoS Shield */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">WAF DDoS Defense</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{status.wafStatus}</div>
          <p className="text-[11px] text-slate-400">Rate Limiter: <span className="text-emerald-400 font-semibold">{status.rateLimiterState}</span></p>
        </div>

        {/* Cryptographic Hash Ledger */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Block Hash Ledger</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">ENFORCED</div>
          <p className="text-[11px] text-slate-400">Signatures: <span className="text-amber-400 font-semibold">HMAC-SHA256 Active</span></p>
        </div>

        {/* TLS 1.3 Transmission Security */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Payload Encryption</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">TLS 1.3 + mTLS</div>
          <p className="text-[11px] text-slate-400">Channel: <span className="text-cyan-400 font-semibold">Mutual Authentication</span></p>
        </div>

        {/* Zero Trust RBAC */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Zero Trust Auth</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">VERIFIED</div>
          <p className="text-[11px] text-slate-400">Scan: <span className="text-purple-400 font-semibold">Clean (0 Vulns)</span></p>
        </div>
      </div>

      {/* Security Audit Trail Log Viewer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              Cryptographic Audit Log & Intrusion Prevention Log
            </h3>
            <p className="text-xs text-slate-400">
              Tamper-evident system access trail logging block approvals, API sync, and blocked attack attempts
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Audit Stream
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">User Role & IP Address</th>
                <th className="p-3">Digital Signature Hash</th>
                <th className="p-3 text-right">Security Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-bold text-amber-400">{log.id}</td>
                  <td className="p-3 text-slate-400">{log.timestamp}</td>
                  <td className="p-3 font-bold text-white">{log.action}</td>
                  <td className="p-3">
                    <div>{log.userRole}</div>
                    <div className="text-[10px] text-slate-500">{log.ipAddress}</div>
                  </td>
                  <td className="p-3 text-[10px] text-cyan-400 font-semibold">{log.digitalSignature}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      log.status === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
