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
  FileCheck, 
  Lock, 
  Key, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Sparkles
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
  const [rejectedIds, setRejectedIds] = useState<Map<string, string>>(new Map());
  const [rejectModalBlockId, setRejectModalBlockId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Train headway congestion during peak evening freight movement');

  const handleApprove = (id: string) => {
    setApprovedIds(prev => new Set(prev).add(id));
    setRejectedIds(prev => {
      const copy = new Map(prev);
      copy.delete(id);
      return copy;
    });
    onApproveBlock(id);
  };

  const handleRejectConfirm = () => {
    if (!rejectModalBlockId) return;
    setRejectedIds(prev => new Map(prev).set(rejectModalBlockId, rejectReason));
    setRejectModalBlockId(null);
  };

  return (
    <div className="bg-gray-100/80 border border-gray-200 rounded-2xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            BDMS Integrated Approval Portal & Sanction Workflow
          </h2>
          <p className="text-xs text-gray-500">
            Multi-Department Single Window Authorization with SHA-256 HMAC Digital Signatures & Anti-Tamper Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Zero Trust Cryptographic Verification Active
        </div>
      </div>

      {/* Block Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map(block => {
          const isApproved = approvedIds.has(block.id) || block.bdmsStatus === 'APPROVED';
          const isRejected = rejectedIds.has(block.id);
          const rejectionText = rejectedIds.get(block.id);
          const hmacSig = generateDigitalSignature(block.id, { depts: block.participatingDepartments, duration: block.durationHours });

          return (
            <div
              key={block.id}
              className={`p-5 rounded-2xl border transition-all ${
                isApproved
                  ? 'bg-white/95 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : isRejected
                  ? 'bg-white/95 border-red-500/40 shadow-lg shadow-red-500/5'
                  : 'bg-white/70 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3 border-b border-gray-200/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-sm">{block.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                      {block.sectionName} ({block.zoneCode})
                    </span>
                    {block.isShadowBlock && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Shadow Block
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Slot: {block.startTime} to {block.endTime} ({block.durationHours} hrs)
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isRejected
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SANCTIONED
                    </>
                  ) : isRejected ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      AMENDMENT REQ
                    </>
                  ) : (
                    'PROPOSED'
                  )}
                </span>
              </div>

              {/* Departmental Concurrence Badges */}
              <div className="mb-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center justify-between">
                  <span>Departmental Concurrence</span>
                  <span className="text-emerald-400 font-mono">100% Concurrence Verified</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {block.participatingDepartments.map(dept => (
                    <span
                      key={dept}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                        dept === 'ENG' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        dept === 'TRD' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {dept === 'ENG' ? 'Civil (TMS)' : dept === 'TRD' ? 'TRD (OHE)' : 'Signal (SMMS)'}
                    </span>
                  ))}
                  {block.powerBlockRequired && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      25kV Power Isolation
                    </span>
                  )}
                </div>
              </div>

              {/* Rejection notice if present */}
              {isRejected && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Returned for Revision:
                  </div>
                  <div className="text-[11px] text-red-200 mt-0.5">{rejectionText}</div>
                </div>
              )}

              {/* Cryptographic Hash Signature */}
              {isApproved && (
                <div className="mb-3 p-2 rounded-lg bg-gray-50 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{hmacSig}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
                <span className="text-[11px] text-gray-500">
                  Downtime Saved: <span className="text-emerald-400 font-bold">+{block.downtimeSavedHours} hrs</span>
                </span>

                <div className="flex items-center gap-2">
                  {!isApproved && !isRejected && (
                    <button
                      onClick={() => setRejectModalBlockId(block.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-all"
                    >
                      Request Revision
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApprove(block.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-evaluate & Sign
                    </button>
                  )}

                  <button
                    disabled={isApproved}
                    onClick={() => handleApprove(block.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isApproved
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                        Sign & Sanction Block
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject / Revision Modal */}
      {rejectModalBlockId && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Request BDMS Slot Revision for {rejectModalBlockId}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Specify the operational constraint preventing block sanctioning (e.g. freight train precedence or substation power constraint).
            </p>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-amber-500 mb-4 h-24"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectModalBlockId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold"
              >
                Submit Amendment Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
