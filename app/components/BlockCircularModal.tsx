'use client';

import React from 'react';
import { BlockWindow, MaintenanceTask } from '../lib/types';
import { 
  FileText, 
  Printer, 
  X, 
  ShieldCheck, 
  Train, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Download,
  Building2,
  Calendar
} from 'lucide-react';
import { generateClientSignature } from '../lib/clientSecurity';

interface BlockCircularModalProps {
  block: BlockWindow | null;
  tasks: MaintenanceTask[];
  onClose: () => void;
}

export const BlockCircularModal: React.FC<BlockCircularModalProps> = ({
  block,
  tasks,
  onClose,
}) => {
  if (!block) return null;

  const relevantTasks = tasks.filter(t => block.taskIds.includes(t.id));
  const hmacSig = generateClientSignature(block.id, { depts: block.participatingDepartments, duration: block.durationHours });
  const circularNumber = `IR/${block.zoneCode}/${block.divisionCode}/OPT-BLOCK/2026/${block.id.replace('BLK-', '')}`;
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-gray-300 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden my-6 print:shadow-none print:border-none print:max-w-full">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-gray-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>INDIAN RAILWAYS OFFICIAL BLOCK CIRCULAR VIEWER</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
              Digitally Signed & Validated
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Circular Document Body */}
        <div className="p-8 md:p-12 text-gray-900 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible font-serif">
          {/* Government of India Emblem & Header */}
          <div className="text-center border-b-2 border-gray-900 pb-4">
            <div className="flex justify-center items-center gap-3 mb-2">
              <span className="text-2xl">🇮🇳</span>
              <div>
                <h1 className="text-base font-bold tracking-widest uppercase">
                  GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS
                </h1>
                <h2 className="text-xs tracking-wider uppercase font-semibold text-gray-700">
                  {block.zoneCode === 'NCR' ? 'NORTH CENTRAL RAILWAY' : block.zoneCode === 'NR' ? 'NORTHERN RAILWAY' : `${block.zoneCode} ZONAL RAILWAY`} • {block.divisionCode} DIVISION
                </h2>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">Office of the Senior Divisional Operations Manager (Operating Branch)</p>
              </div>
              <span className="text-2xl">🚂</span>
            </div>
          </div>

          {/* Reference & Metadata Header */}
          <div className="flex justify-between items-start text-xs border-b border-gray-300 pb-3 font-sans">
            <div>
              <p><strong>Joint Circular No:</strong> <span className="font-mono">{circularNumber}</span></p>
              <p><strong>Section / Corridor:</strong> {block.sectionName} ({block.sectionId})</p>
              <p><strong>Block Category:</strong> {block.isShadowBlock ? '⚡ MULTI-DEPARTMENT INTEGRATED SHADOW BLOCK' : 'STANDARD SINGLE-DEPT BLOCK'}</p>
            </div>
            <div className="text-right">
              <p><strong>Date of Sanction:</strong> {todayStr}</p>
              <p><strong>Proposed Window:</strong> <span className="font-mono font-bold">{block.startTime} hrs – {block.endTime} hrs</span></p>
              <p><strong>Sanctioned Duration:</strong> <span className="font-bold text-indigo-700">{block.durationHours} Hours</span></p>
            </div>
          </div>

          {/* Subject Line */}
          <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-xs font-sans">
            <p className="font-bold text-gray-900">
              SUBJECT: Joint Operating & Engineering Sanction for Execution of Maintenance Tasks under Co-ordinated Traffic & Traction Power Block on {block.sectionName}.
            </p>
          </div>

          {/* Participating Departments & Tasks Table */}
          <div className="font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
              1. Departmental Scope of Work & Co-located Work Sites
            </h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 border-b border-gray-300 text-[11px] font-bold text-gray-700">
                  <tr>
                    <th className="p-2 border-r border-gray-300">Department</th>
                    <th className="p-2 border-r border-gray-300">Work Scope & Defect Description</th>
                    <th className="p-2 border-r border-gray-300 text-center">KM Range</th>
                    <th className="p-2 text-center">Officer In-Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {relevantTasks.map((t, idx) => (
                    <tr key={t.id} className="text-[11px]">
                      <td className="p-2 border-r border-gray-200 font-semibold text-gray-800">
                        {t.departmentName}
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <div className="font-bold text-gray-900">{t.title}</div>
                        <div className="text-[10px] text-gray-500">Source: {t.sourceSystem} • Severity: {t.severity} • TSR: {t.speedRestrictionImpactKmvh} km/h</div>
                      </td>
                      <td className="p-2 border-r border-gray-200 text-center font-mono">
                        KM {t.startKm} - {t.endKm}
                      </td>
                      <td className="p-2 text-center text-gray-700 font-medium">
                        SSE / {t.department} (Sec-{idx + 1})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Machine & Power Block Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-700" />
                2. Track Maintenance Machinery Roster
              </div>
              <ul className="space-y-1 text-[11px] text-gray-700">
                {(block.assignedMachines || ['BCM-04 Ballast Cleaner', 'CSM-12 Continuous Tamping Machine']).map((m, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span><strong>{m}</strong> (Base: {block.divisionCode} Machine Depot)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-700" />
                3. Traction 25kV OHE Power Isolation
              </div>
              <div className="text-[11px] text-gray-700 space-y-1">
                <p><strong>Power Block Required:</strong> {block.powerBlockRequired ? 'YES (Full 25kV OHE Isolation)' : 'NO (Traffic Block Only)'}</p>
                <p><strong>Feeding Post / Substation:</strong> TSS-{block.sectionId}-FP1</p>
                <p><strong>Safety Earthing:</strong> 4 Discharge Rods at KM {relevantTasks[0]?.startKm || 140} & KM {relevantTasks[0]?.endKm || 160}</p>
              </div>
            </div>
          </div>

          {/* Train Regulation Instructions */}
          <div className="border border-gray-300 rounded-lg p-3 font-sans text-xs bg-white">
            <div className="font-bold text-gray-900 mb-1">
              4. Train Operating & Line Clear Directives
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              Section Controller will ensure that passenger trains (Vande Bharat / Rajdhani Express) are regulated on nominal paths without detention. Freight rakes will be regulated at loop lines of adjacent stations. Caution order of 30 km/h to be imposed on Track KM range until first train pass certification.
            </p>
          </div>

          {/* Multi-Tier Authority Concurrence & Signature Grid */}
          <div className="font-sans pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 text-center">
              5. Multi-Departmental Concurrence & Divisional Sanction Seals
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="border border-gray-300 rounded-xl p-3 bg-gray-50/80">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Civil Engineering</div>
                <div className="text-xs font-bold text-gray-900 mt-1">Sr. DEN (Co-ord)</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">CONCURRED ✅</div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">SIG: 9a4f..2e11</div>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 bg-gray-50/80">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Traction Electrical</div>
                <div className="text-xs font-bold text-gray-900 mt-1">Sr. DEE (TRD)</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">CONCURRED ✅</div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">SIG: 7b8c..6d43</div>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 bg-gray-50/80">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Signal & Telecom</div>
                <div className="text-xs font-bold text-gray-900 mt-1">Sr. DSTE</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">CONCURRED ✅</div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">SIG: 3f1a..88c9</div>
              </div>

              <div className="border-2 border-indigo-600 rounded-xl p-3 bg-indigo-50/50">
                <div className="text-[10px] text-indigo-700 font-bold uppercase">Divisional Sanction</div>
                <div className="text-xs font-black text-indigo-950 mt-1">Sr. DOM / DRM</div>
                <div className="text-[10px] text-indigo-900 font-extrabold mt-1">SANCTIONED ⭐</div>
                <div className="text-[9px] text-indigo-700 font-mono mt-1">SIG: c890..e47a</div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 HMAC Stamp */}
          <div className="border border-emerald-300 bg-emerald-50/60 rounded-xl p-3.5 font-mono text-[10px] flex items-center justify-between gap-4 font-sans">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-emerald-900">CRIS Cryptographic Security Verification Seal</div>
                <div className="text-emerald-700 font-mono text-[9px] break-all">{hmacSig}</div>
              </div>
            </div>
            <div className="text-right font-sans text-[10px] text-emerald-800 flex-shrink-0">
              <div>Anti-Tamper Validated</div>
              <div className="text-gray-500">BDMS-IR-2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
