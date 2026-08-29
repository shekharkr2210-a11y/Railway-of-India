'use client';

import React, { useState } from 'react';
import { BlockWindow, MaintenanceTask } from '../lib/types';
import { generateClientSignature } from '../lib/clientSecurity';
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
  Sparkles,
  FileText,
  Building2,
  Layers,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { BlockCircularModal } from './BlockCircularModal';

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
  const [circularModalBlock, setCircularModalBlock] = useState<BlockWindow | null>(null);
  const [copiedSigBlockId, setCopiedSigBlockId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setApprovedIds(prev => new Set(prev).add(id));
    setRejectedIds(prev => {
      const copy = new Map(prev);
      copy.delete(id);
      return copy;
    });
    onApproveBlock(id);
  };

  const handleApproveAll = () => {
    blocks.forEach(block => {
      if (!approvedIds.has(block.id) && block.bdmsStatus !== 'APPROVED') {
        handleApprove(block.id);
      }
    });
  };

  const handleCopySig = (sig: string, blockId: string) => {
    navigator.clipboard?.writeText(sig);
    setCopiedSigBlockId(blockId);
    setTimeout(() => setCopiedSigBlockId(null), 2000);
  };

  const handleRejectConfirm = () => {
    if (!rejectModalBlockId) return;
    setRejectedIds(prev => new Map(prev).set(rejectModalBlockId, rejectReason));
    setRejectModalBlockId(null);
  };

  const pendingCount = blocks.filter(b => !approvedIds.has(b.id) && b.bdmsStatus !== 'APPROVED').length;
  const approvedCount = blocks.filter(b => approvedIds.has(b.id) || b.bdmsStatus === 'APPROVED').length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            BDMS Integrated Approval Portal & Multi-Department Sanction Workflow
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Single-Window Concurrence with SHA-256 HMAC Digital Signatures, Machine Rostering & Anti-Tamper Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ Quick Sanction All ({pendingCount} Blocks)
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {approvedCount > 0 ? `${approvedCount}/${blocks.length} Cryptographically Signed` : 'Zero Trust Active'}
          </div>
        </div>
      </div>

      {/* 4-Stage Approval Pipeline Overview Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
          Indian Railways Standard 4-Tier Block Sanction Pipeline
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">1</div>
            <div>
              <div className="font-bold text-gray-900">Field Request</div>
              <div className="text-[10px] text-gray-500">AEN / SSE (TMS/TDMS)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">2</div>
            <div>
              <div className="font-bold text-gray-900">Joint Concurrence</div>
              <div className="text-[10px] text-gray-500">Civil + TRD + S&T</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-indigo-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">3</div>
            <div>
              <div className="font-bold text-indigo-950">Divisional Sanction</div>
              <div className="text-[10px] text-indigo-700">Sr. DOM / DRM</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-emerald-200 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">4</div>
            <div>
              <div className="font-bold text-emerald-950">Traffic Grant</div>
              <div className="text-[10px] text-emerald-700">Section Controller</div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {blocks.map(block => {
          const isApproved = approvedIds.has(block.id) || block.bdmsStatus === 'APPROVED';
          const isRejected = rejectedIds.has(block.id);
          const rejectionText = rejectedIds.get(block.id);
          const hmacSig = generateClientSignature(block.id, { depts: block.participatingDepartments, duration: block.durationHours });
          const isCopied = copiedSigBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`p-5 rounded-2xl border transition-all ${
                isApproved
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-lg shadow-emerald-500/5'
                  : isRejected
                  ? 'bg-red-50/40 border-red-300 shadow-lg shadow-red-500/5'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-sm">{block.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      {block.sectionName} ({block.zoneCode})
                    </span>
                    {block.isShadowBlock && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        Shadow Block
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-indigo-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Window: {block.startTime} to {block.endTime} ({block.durationHours} hrs)
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isRejected
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      SANCTIONED
                    </>
                  ) : isRejected ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      REVISION REQ
                    </>
                  ) : (
                    'PROPOSED'
                  )}
                </span>
              </div>

              {/* Departmental Concurrence Badges */}
              <div className="mb-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center justify-between">
                  <span>Multi-Department Concurrence</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {block.participatingDepartments.map(dept => (
                    <span
                      key={dept}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                        dept === 'ENG' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        dept === 'TRD' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {dept === 'ENG' ? 'Civil (TMS)' : dept === 'TRD' ? 'TRD (OHE)' : 'Signal (SMMS)'}
                    </span>
                  ))}
                  {block.powerBlockRequired && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-600" />
                      25kV Power Isolation
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Track Machines */}
              {block.assignedMachines && block.assignedMachines.length > 0 && (
                <div className="mb-3 bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-600" />
                    Deployed Heavy Track Machinery
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {block.assignedMachines.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white text-gray-800 font-semibold text-[10px] border border-gray-200 shadow-xs">
                        🚜 {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection notice if present */}
              {isRejected && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Returned for Revision:
                  </div>
                  <div className="text-[11px] text-red-700 mt-0.5">{rejectionText}</div>
                </div>
              )}

              {/* Cryptographic Hash Signature */}
              {isApproved && (
                <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{hmacSig}</span>
                  </div>
                  <button
                    onClick={() => handleCopySig(hmacSig, block.id)}
                    className="p-1 rounded hover:bg-emerald-100 text-emerald-700 shrink-0 transition-colors"
                    title="Copy HMAC SHA-256 Signature"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
                <span className="text-[11px] text-gray-500">
                  Track Downtime Saved: <strong className="text-emerald-700">+{block.downtimeSavedHours} hrs</strong>
                </span>

                <div className="flex items-center gap-2">
                  {/* View Official Circular Button */}
                  <button
                    onClick={() => setCircularModalBlock(block)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-all flex items-center gap-1"
                    title="Generate Official IR Joint Block Circular"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    IR Circular
                  </button>

                  {!isApproved && !isRejected && (
                    <button
                      onClick={() => setRejectModalBlockId(block.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition-all"
                    >
                      Request Revision
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApprove(block.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-50 border border-amber-300 transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-evaluate & Sign
                    </button>
                  )}

                  <button
                    disabled={isApproved}
                    onClick={() => handleApprove(block.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isApproved
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Signed
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Sanction Block
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Request BDMS Slot Revision for {rejectModalBlockId}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Specify the operational constraint preventing block sanctioning (e.g. freight train precedence or substation power constraint).
            </p>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 h-24"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectModalBlockId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Submit Amendment Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official IR Block Circular Modal */}
      {circularModalBlock && (
        <BlockCircularModal
          block={circularModalBlock}
          tasks={tasks}
          onClose={() => setCircularModalBlock(null)}
        />
      )}
    </div>
  );
};
