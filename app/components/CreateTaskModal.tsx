import React, { useState } from 'react';
import { MaintenanceTask, Department, TaskSeverity } from '../lib/types';
import { X } from 'lucide-react';

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: (task: MaintenanceTask) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated }) => {
  const [department, setDepartment] = useState<Department>('ENG');
  const [title, setTitle] = useState('');
  const [zone, setZone] = useState('');
  const [division, setDivision] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [startKm, setStartKm] = useState<number>(0);
  const [endKm, setEndKm] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);
  const [severity, setSeverity] = useState<TaskSeverity>('MEDIUM');
  const [overdueDays, setOverdueDays] = useState<number>(0);
  const [speedRestriction, setSpeedRestriction] = useState<number>(0);
  const [powerBlock, setPowerBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTask: Partial<MaintenanceTask> = {
        department,
        title,
        zoneCode: zone,
        divisionCode: division,
        sectionName,
        startKm,
        endKm,
        estimatedDurationHours: duration,
        severity,
        overdueDays,
        speedRestrictionImpactKmvh: speedRestriction,
        requiresPowerBlock: powerBlock,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        const createdTask = await res.json();
        onTaskCreated(createdTask.task);
      } else {
        alert('Failed to create task.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Register Defect / Work Order</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value as Department)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="ENG">ENG - Civil Engineering (Track)</option>
                  <option value="TRD">TRD - Traction Distribution (OHE)</option>
                  <option value="SMMS">SMMS - Signal & Telecom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select value={severity} onChange={e => setSeverity(e.target.value as TaskSeverity)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. USFD Rail Flaw Rectification..." className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <input type="text" value={zone} onChange={e => setZone(e.target.value)} required placeholder="e.g. NR" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <input type="text" value={division} onChange={e => setDivision(e.target.value)} required placeholder="e.g. DLI" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Corridor Section</label>
              <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)} required placeholder="e.g. NDLS-FZB" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start KM</label>
                <input type="number" step="0.1" value={startKm} onChange={e => setStartKm(parseFloat(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End KM</label>
                <input type="number" step="0.1" value={endKm} onChange={e => setEndKm(parseFloat(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hrs)</label>
                <input type="number" step="0.5" value={duration} onChange={e => setDuration(parseFloat(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Days</label>
                <input type="number" value={overdueDays} onChange={e => setOverdueDays(parseInt(e.target.value, 10))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Speed Impact (km/h)</label>
                <input type="number" value={speedRestriction} onChange={e => setSpeedRestriction(parseInt(e.target.value, 10))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="powerBlock" checked={powerBlock} onChange={e => setPowerBlock(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label htmlFor="powerBlock" className="text-sm font-medium text-gray-700">25kV OHE Power Block Required</label>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
