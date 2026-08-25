'use client';

import React, { useState } from 'react';
import { BlockWindow, MaintenanceTask } from '../lib/types';
import { generateDigitalSignature } from '../lib/security';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  FileCheck,
  Building2,
  Lock,
  Key
} from 'lucide-react';

interface BDMSWorkflowProps {
  blocks: BlockWindow[];
  tasks: MaintenanceTask[];
  onApproveBlock: (blockId: string) => void;
}

export const BDMSWorkflow: React.FC<BDMSWorkflowProps> = ({
  blocks,
  tasks,
  onApproveBlock,
}) => {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const handleApprove = (id: string) => {
    setApprovedIds(prev => new Set(prev).add(id));
    onApproveBlock(id);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            BDMS Integrated Approval Portal & Sanction Workflow
          </h2>
          <p className="text-xs text-slate-400">
            Multi-Department Single Window Authorization with HMAC SHA-256 Cryptographic Digital Signatures
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Zero Trust Cryptographic Verification Active
        </div>
      </div>

      {/* Block Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map(block => {
          const isApproved = approvedIds.has(block.id) || block.bdmsStatus === 'APPROVED';
          const blockTasks = tasks.filter(t => block.taskIds.includes(t.id));
          const hmacSig = generateDigitalSignature(block.id, { depts: block.participatingDepartments, duration: block.durationHours });

          return (
            <div
              key={block.id}
              className={`p-5 rounded-2xl border transition-all ${
                isApproved
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{block.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {block.sectionName} ({block.zoneCode})
                    </span>
                  </div>
                  <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Slot: {block.startTime} to {block.endTime} ({block.durationHours} hrs)
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SANCTIONED
                    </>
                  ) : (
                    'PROPOSED'
                  )}
                </span>
              </div>

              {/* Departments Involved */}
              <div className="mb-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Participating Departments & Power Block
                </div>
                <div className="flex items-center gap-2">
                  {block.participatingDepartments.map(dept => (
                    <span
                      key={dept}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dept === 'ENG' ? 'bg-blue-500/20 text-blue-300' :
                        dept === 'TRD' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {dept === 'ENG' ? 'Civil (TMS)' : dept === 'TRD' ? 'TRD (OHE)' : 'Signal (SMMS)'}
                    </span>
                  ))}
                  {block.powerBlockRequired && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      OHE Power Isolation
                    </span>
                  )}
                </div>
              </div>

              {/* Cryptographic Hash Signature */}
              {isApproved && (
                <div className="mb-3 p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{hmacSig}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Downtime Saved: <span className="text-emerald-400 font-bold">+{block.downtimeSavedHours} hrs</span>
                </span>

                <button
                  disabled={isApproved}
                  onClick={() => handleApprove(block.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isApproved
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isApproved ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Sanctioned & Signed
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Sign & Sanction Combined Block
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
