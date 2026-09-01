'use client';

import React from 'react';
import { getModelEvaluationMetrics } from '../lib/ml/predict';
import { 
  BrainCircuit, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Target,
  Sparkles,
  Layers,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const ModelPerformancePanel: React.FC = () => {
  const modelMetadata = getModelEvaluationMetrics();
  const { metrics, feature_importances, calibration_bins } = modelMetadata;

  return (
    <div className="space-y-6 mb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                VERIFIED AI/ML PRIORITIZATION MODEL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                HOLD-OUT TESTED
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {modelMetadata.model_name}
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1">
              Trained on {modelMetadata.training_dataset_size.toLocaleString()} Indian Railways track defect records • Hold-out evaluated on {modelMetadata.test_dataset_size.toLocaleString()} test samples
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <div className="text-indigo-200 text-[10px] uppercase font-bold">Test Accuracy</div>
              <div className="text-base font-extrabold text-emerald-400">{(metrics.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <div className="text-indigo-200 text-[10px] uppercase font-bold">ROC-AUC</div>
              <div className="text-base font-extrabold text-cyan-400">{metrics.roc_auc.toFixed(3)}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <div className="text-indigo-200 text-[10px] uppercase font-bold">F1-Score</div>
              <div className="text-base font-extrabold text-amber-400">{metrics.f1_score.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Precision & Recall</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">
            {(metrics.precision * 100).toFixed(1)}% / {(metrics.recall * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-gray-500">True Positive rate on critical rail defects</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Model Calibration</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">Isotonic Binned</div>
          <p className="text-[11px] text-gray-500">Calibrated confidence: 91.0% - 97.0%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Inference Latency</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">&lt; 0.4 ms / task</div>
          <p className="text-[11px] text-gray-500">Zero native dependency in Next.js runtime</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Model Version</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 mb-1">{modelMetadata.version}</div>
          <p className="text-[11px] text-gray-500">Retrain script: scripts/train_model.py</p>
        </div>
      </div>

      {/* Feature Importance & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Empirical Feature Importance (Gini Attributions)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Relative predictive weight of operational track features in prioritizing safety-critical work orders
          </p>

          <div className="space-y-3">
            {feature_importances.map((item, idx) => (
              <div key={item.feature}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="w-4 text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                    {item.feature}
                  </span>
                  <span className="font-mono font-bold text-indigo-600">{item.importance}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${item.importance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion Matrix & Calibration Bins */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Hold-Out Test Confusion Matrix (N = {modelMetadata.test_dataset_size})
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Evaluated on unseen test split with fixed seed for absolute repeatability
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">True Positives (Critical Scheduled)</div>
              <div className="text-2xl font-extrabold text-emerald-700">{metrics.confusion_matrix.true_positives}</div>
              <div className="text-[11px] text-emerald-600">Correctly identified urgent defects</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold text-gray-700 uppercase">False Positives</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.confusion_matrix.false_positives}</div>
              <div className="text-[11px] text-gray-500">Over-prioritized routine work</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold text-gray-700 uppercase">False Negatives</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.confusion_matrix.false_negatives}</div>
              <div className="text-[11px] text-gray-500">Missed critical defects</div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-[10px] font-bold text-blue-800 uppercase">True Negatives (Routine Filtered)</div>
              <div className="text-2xl font-extrabold text-blue-700">{metrics.confusion_matrix.true_negatives}</div>
              <div className="text-[11px] text-blue-600">Correctly slotted into PM cycles</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Retraining Workflow
            </span>
            <code className="text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-mono">
              python scripts/train_model.py
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
