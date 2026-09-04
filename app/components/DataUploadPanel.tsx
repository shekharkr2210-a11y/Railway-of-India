'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, XCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

interface DataUploadPanelProps {
  onSuccess?: () => void;
}

export const DataUploadPanel: React.FC<DataUploadPanelProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceSystem, setSourceSystem] = useState<string>('TMS');
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    importedCount?: number;
    errors?: any[];
    error?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const parsePreview = async (selectedFile: File) => {
    const text = await selectedFile.text();
    const lines = text.split('\n').filter(line => line.trim() !== '').slice(0, 11);
    const parsed = lines.map(line => {
      // Basic CSV split just for preview
      const row = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          row.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current);
      return row;
    });
    setPreviewData(parsed);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile);
      setUploadResult(null);
      await parsePreview(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      await parsePreview(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceSystem', sourceSystem);

    try {
      const endpoint = sourceSystem === 'COA' ? '/api/import/timetable' : '/api/import/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setUploadResult(data);

      if (data.success && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-100">
          <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
          Data Import Center
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Upload CSV files from core railway systems (TMS, SMMS, TDMS, COA) to ingest data directly into the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Select Source System</label>
            <select
              value={sourceSystem}
              onChange={(e) => setSourceSystem(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TMS">TMS (Civil Track Defects)</option>
              <option value="SMMS">SMMS (Signaling Assets)</option>
              <option value="TDMS">TDMS (Traction / OHE)</option>
              <option value="COA">COA (Train Timetable)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Upload CSV File</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-indigo-400 bg-gray-800/50'}
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
              />
              <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-indigo-400' : 'text-gray-500'}`} />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-indigo-300">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-300">Drag & drop your CSV file here</p>
                  <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Validate & Import
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {uploadResult && (
            <div className={`p-4 rounded-xl border ${uploadResult.success ? 'bg-emerald-900/30 border-emerald-800' : 'bg-red-900/30 border-red-800'}`}>
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                )}
                <div>
                  <h3 className={`text-sm font-bold ${uploadResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {uploadResult.success ? 'Import Successful' : 'Import Failed'}
                  </h3>
                  {uploadResult.success ? (
                    <p className="text-xs text-emerald-200 mt-1">
                      Successfully imported {uploadResult.importedCount} records into the database.
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                         <span className="text-amber-400 ml-2">({uploadResult.errors.length} skipped due to errors)</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-red-200 mt-1">{uploadResult.error}</p>
                  )}
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4 bg-gray-900 rounded-lg border border-gray-700 p-3 max-h-40 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Validation Errors
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-400">
                    {uploadResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li>...and {uploadResult.errors.length - 10} more errors.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden h-full min-h-[300px] flex flex-col">
            <div className="bg-gray-800/80 px-4 py-3 border-b border-gray-700">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Data Preview</h3>
            </div>
            
            <div className="p-0 overflow-x-auto flex-1">
              {previewData.length > 0 ? (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-900/50 text-gray-400 border-b border-gray-700">
                    <tr>
                      {previewData[0].map((header, i) => (
                        <th key={i} className="px-4 py-2.5 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50 text-gray-300">
                    {previewData.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-700/30">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2 truncate max-w-[150px]" title={cell}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                  <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No data to preview</p>
                  <p className="text-xs mt-1">Upload a file to see its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
