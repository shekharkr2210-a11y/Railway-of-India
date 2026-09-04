import modelData from './model.json';

export interface MLModelArtifact {
  model_name: string;
  version: string;
  trained_at: string;
  training_dataset_size: number;
  test_dataset_size: number;
  metrics: {
    accuracy: number;
    roc_auc: number;
    f1_score: number;
    precision: number;
    recall: number;
    confusion_matrix: {
      true_positives: number;
      false_positives: number;
      true_negatives: number;
      false_negatives: number;
    };
  };
  weights: number[];
  bias: number;
  feature_importances: Array<{ feature: string; importance: number; weight: number }>;
  calibration_bins: Array<{ bin: string; expected: number; observed: number; confidence: number }>;
}

export const ML_MODEL_METADATA: MLModelArtifact = modelData as MLModelArtifact;

export interface MLInferenceResult {
  failureProbability: number; // 0.0 to 1.0
  calibratedConfidence: number; // 0.90 to 0.98 based on calibration curve
  riskTier: 'CRITICAL_URGENT' | 'ELEVATED_MONITOR' | 'ROUTINE_PREVENTIVE';
  featureAttributions: {
    severityContribution: number;
    overdueContribution: number;
    speedImpactContribution: number;
    densityContribution: number;
    powerBlockContribution: number;
  };
}

/**
 * Executes inference on the trained Indian Railways Prioritization Model.
 */
export function predictFailureProbability(features: {
  severityWeight: number;
  overdueFactor: number;
  speedImpactFactor: number;
  trafficDensityMultiplier: number;
  powerBlockImpact: number;
}): MLInferenceResult {
  const { weights, bias, calibration_bins } = ML_MODEL_METADATA;

  const x = [
    features.severityWeight,
    features.overdueFactor,
    features.speedImpactFactor,
    features.trafficDensityMultiplier,
    features.powerBlockImpact > 0 ? 1 : 0,
  ];

  // Compute logit with feature attributions
  const z = bias + (
    (weights[0] * x[0]) +
    (weights[1] * x[1]) +
    (weights[2] * x[2]) +
    (weights[3] * x[3]) +
    (weights[4] * x[4])
  );

  const boundedZ = Math.max(-20, Math.min(20, z));
  const rawProb = 1.0 / (1.0 + Math.exp(-boundedZ));
  const failureProbability = parseFloat(Math.max(0.01, Math.min(0.99, rawProb)).toFixed(3));

  // Determine calibrated confidence score from calibration curve
  let calibratedConfidence = 0.93;
  for (const bin of calibration_bins) {
    const [minStr, maxStr] = bin.bin.split(' - ').map(Number);
    if (failureProbability >= minStr && failureProbability <= maxStr) {
      calibratedConfidence = bin.confidence;
      break;
    }
  }

  let riskTier: MLInferenceResult['riskTier'] = 'ROUTINE_PREVENTIVE';
  if (failureProbability >= 0.70) {
    riskTier = 'CRITICAL_URGENT';
  } else if (failureProbability >= 0.40) {
    riskTier = 'ELEVATED_MONITOR';
  }

  return {
    failureProbability,
    calibratedConfidence,
    riskTier,
    featureAttributions: {
      severityContribution: parseFloat((weights[0] * x[0]).toFixed(2)),
      overdueContribution: parseFloat((weights[1] * x[1]).toFixed(2)),
      speedImpactContribution: parseFloat((weights[2] * x[2]).toFixed(2)),
      densityContribution: parseFloat((weights[3] * x[3]).toFixed(2)),
      powerBlockContribution: parseFloat((weights[4] * x[4]).toFixed(2)),
    },
  };
}

export function getModelEvaluationMetrics(): MLModelArtifact {
  return ML_MODEL_METADATA;
}

export function getFeatureImportanceRanking(): Array<{ feature: string; importance: number; weight: number }> {
  return ML_MODEL_METADATA.feature_importances.sort((a, b) => b.importance - a.importance);
}
