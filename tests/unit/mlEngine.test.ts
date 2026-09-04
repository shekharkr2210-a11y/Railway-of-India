import { describe, it, expect } from 'vitest';
import { calculateMLCriticality, extractTaskFeatures, explainTaskCriticality } from '@/app/lib/mlEngine';
import { predictFailureProbability, getModelEvaluationMetrics } from '@/app/lib/ml/predict';
import { INITIAL_MAINTENANCE_TASKS, INITIAL_CORRIDOR_SECTIONS } from '@/app/lib/mockData';

describe('mlEngine & ML model', () => {
  it('calculates criticality scores strictly bounded in [10, 99]', () => {
    for (const task of INITIAL_MAINTENANCE_TASKS) {
      const section = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === task.sectionId);
      const score = calculateMLCriticality(task, section);

      expect(score).toBeGreaterThanOrEqual(10);
      expect(score).toBeLessThanOrEqual(99);
    }
  });

  it('assigns higher criticality to overdue tasks than fresh tasks', () => {
    const baseTask = INITIAL_MAINTENANCE_TASKS[0];
    const section = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === baseTask.sectionId);

    const freshScore = calculateMLCriticality({ ...baseTask, overdueDays: 0 }, section);
    const overdueScore = calculateMLCriticality({ ...baseTask, overdueDays: 14 }, section);

    expect(overdueScore).toBeGreaterThan(freshScore);
  });

  it('produces explainable XAI mathematical feature attributions', () => {
    const task = INITIAL_MAINTENANCE_TASKS[0];
    const section = INITIAL_CORRIDOR_SECTIONS.find(s => s.id === task.sectionId);
    const explanation = explainTaskCriticality(task, section);

    expect(explanation.taskId).toBe(task.id);
    expect(explanation.totalScore).toBeGreaterThanOrEqual(10);
    expect(explanation.features.severityScore).toBeGreaterThan(0);
    expect(explanation.explanation).toBeDefined();
    expect(explanation.explanation.length).toBeGreaterThan(20);
  });

  it('loads trained ML model metadata with real measured hold-out metrics', () => {
    const metadata = getModelEvaluationMetrics();

    expect(metadata.model_name).toBeDefined();
    expect(metadata.metrics.accuracy).toBeGreaterThan(0.85);
    expect(metadata.metrics.roc_auc).toBeGreaterThan(0.90);
    expect(metadata.feature_importances.length).toBeGreaterThanOrEqual(5);
  });

  it('runs ML failure probability inference with calibrated confidence bounds', () => {
    const result = predictFailureProbability({
      severityWeight: 0.45,
      overdueFactor: 0.8,
      speedImpactFactor: 0.5,
      trafficDensityMultiplier: 1.4,
      powerBlockImpact: 0.15,
    });

    expect(result.failureProbability).toBeGreaterThan(0);
    expect(result.failureProbability).toBeLessThanOrEqual(1.0);
    expect(result.calibratedConfidence).toBeGreaterThanOrEqual(0.90);
    expect(result.calibratedConfidence).toBeLessThanOrEqual(1.0);
  });
});
