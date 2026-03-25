/**
 * Shared statistical functions for A/B test tools.
 *
 * Formulas used:
 * - Two-proportion z-test for binary outcomes (trial starts, purchases)
 * - Two-sample t-test (Welch's) for continuous outcomes (LTV/revenue)
 * - Power analysis for sample-size estimation
 * - Bonferroni correction for multiple comparisons
 */
import pkg from 'jstat';
const { jStat } = pkg;

// ── Normal distribution helpers ──────────────────────────────────────

/** CDF of the standard normal distribution */
export function normalCDF(z: number): number {
  return jStat.normal.cdf(z, 0, 1);
}

/** Inverse CDF (quantile) of the standard normal distribution */
export function normalInv(p: number): number {
  return jStat.normal.inv(p, 0, 1);
}

// ── Multiple-comparison correction ───────────────────────────────────

/** Number of pairwise comparisons for v variants */
export function pairwiseComparisons(numVariants: number): number {
  return (numVariants * (numVariants - 1)) / 2;
}

/** Bonferroni-corrected alpha for multiple pairwise comparisons */
export function bonferroniAlpha(baseAlpha: number, numVariants: number): number {
  return baseAlpha / pairwiseComparisons(numVariants);
}

// ── Proportion (binary) z-test ───────────────────────────────────────

export interface ProportionTestResult {
  p1: number;
  p2: number;
  liftPercent: number;
  zScore: number;
  pValue: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
}

/**
 * Two-proportion z-test comparing two variants.
 * Returns the lift of variant 2 relative to variant 1.
 */
export function proportionZTest(
  successes1: number,
  n1: number,
  successes2: number,
  n2: number,
  alpha: number = 0.05,
): ProportionTestResult {
  const p1 = n1 > 0 ? successes1 / n1 : 0;
  const p2 = n2 > 0 ? successes2 / n2 : 0;

  // Pooled proportion under H0
  const pPool = (n1 + n2) > 0 ? (successes1 + successes2) / (n1 + n2) : 0;
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / Math.max(n1, 1) + 1 / Math.max(n2, 1)));

  const diff = p2 - p1;
  const zScore = se > 0 ? diff / se : 0;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore))); // two-tailed

  // Confidence interval for the difference (unpooled SE)
  const seDiff = Math.sqrt(
    (p1 * (1 - p1)) / Math.max(n1, 1) + (p2 * (1 - p2)) / Math.max(n2, 1),
  );
  const zCrit = normalInv(1 - alpha / 2);
  const ciLow = diff - zCrit * seDiff;
  const ciHigh = diff + zCrit * seDiff;

  const liftPercent = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

  return {
    p1,
    p2,
    liftPercent,
    zScore,
    pValue,
    confidenceInterval: [ciLow, ciHigh],
    isSignificant: pValue < alpha,
  };
}

// ── Mean (continuous) t-test ─────────────────────────────────────────

export interface MeanTestResult {
  mean1: number;
  mean2: number;
  liftPercent: number;
  tScore: number;
  pValue: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
}

/**
 * Welch's two-sample t-test for comparing means (e.g. LTV).
 *
 * If realStd1/realStd2 are provided (computed from per-product data),
 * those are used. Otherwise falls back to a heuristic: std ≈ 1.5 × mean.
 */
export function meanTTest(
  totalRevenue1: number,
  n1: number,
  totalRevenue2: number,
  n2: number,
  alpha: number = 0.05,
  realStd1?: number,
  realStd2?: number,
): MeanTestResult {
  const mean1 = n1 > 0 ? totalRevenue1 / n1 : 0;
  const mean2 = n2 > 0 ? totalRevenue2 / n2 : 0;

  const STD_MULTIPLIER = 1.5;
  const std1 = realStd1 ?? mean1 * STD_MULTIPLIER;
  const std2 = realStd2 ?? mean2 * STD_MULTIPLIER;

  const var1 = (std1 * std1) / Math.max(n1, 1);
  const var2 = (std2 * std2) / Math.max(n2, 1);
  const se = Math.sqrt(var1 + var2);

  const diff = mean2 - mean1;
  const tScore = se > 0 ? diff / se : 0;

  // Welch-Satterthwaite degrees of freedom
  const df =
    se > 0
      ? (var1 + var2) ** 2 / ((var1 ** 2) / Math.max(n1 - 1, 1) + (var2 ** 2) / Math.max(n2 - 1, 1))
      : 1;

  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tScore), df));

  const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
  const ciLow = diff - tCrit * se;
  const ciHigh = diff + tCrit * se;

  const liftPercent = mean1 > 0 ? ((mean2 - mean1) / mean1) * 100 : 0;

  return {
    mean1,
    mean2,
    liftPercent,
    tScore,
    pValue,
    confidenceInterval: [ciLow, ciHigh],
    isSignificant: pValue < alpha,
  };
}

// ── Sample size estimation ───────────────────────────────────────────

/**
 * Minimum sample size per variant to detect a given relative lift
 * in a proportion (binary outcome) with specified power and alpha.
 *
 * Formula: n = (z_{α/2} + z_β)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
 */
export function sampleSizeForProportion(
  baseRate: number,
  relativeLiftPercent: number,
  alpha: number = 0.05,
  power: number = 0.8,
): number {
  if (baseRate <= 0 || baseRate >= 1) return Infinity;

  const p1 = baseRate;
  const p2 = baseRate * (1 + relativeLiftPercent / 100);
  if (p2 <= 0 || p2 >= 1) return Infinity;

  const delta = p2 - p1;
  if (Math.abs(delta) < 1e-10) return Infinity;

  const zAlpha = normalInv(1 - alpha / 2);
  const zBeta = normalInv(power);

  const n = ((zAlpha + zBeta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / (delta * delta);
  return Math.ceil(n);
}

/**
 * Minimum sample size per variant to detect a given relative lift
 * in a mean (continuous outcome like LTV) with specified power and alpha.
 *
 * If realStd is provided, uses it. Otherwise falls back to heuristic.
 */
export function sampleSizeForMean(
  baseMean: number,
  relativeLiftPercent: number,
  alpha: number = 0.05,
  power: number = 0.8,
  realStd?: number,
): number {
  if (baseMean <= 0) return Infinity;

  const std = realStd ?? baseMean * 1.5;
  const delta = baseMean * (relativeLiftPercent / 100);
  if (Math.abs(delta) < 1e-10) return Infinity;

  const zAlpha = normalInv(1 - alpha / 2);
  const zBeta = normalInv(power);

  // Two-sample: n = 2 × (z_α/2 + z_β)² × σ² / δ²
  const n = (2 * (zAlpha + zBeta) ** 2 * std * std) / (delta * delta);
  return Math.ceil(n);
}

/**
 * Given observed data, estimate how many additional samples per variant
 * are needed to confirm an observed lift at the given alpha and power.
 *
 * Returns 0 if the result is already significant.
 * Returns Infinity if the observed lift is negligible.
 */
export function additionalSamplesNeeded(
  currentN: number,
  requiredN: number,
): number {
  if (requiredN <= currentN) return 0;
  if (!isFinite(requiredN)) return Infinity;
  return requiredN - currentN;
}

// ── Verdict logic ────────────────────────────────────────────────────

export type Verdict = 'yes' | 'not_yet' | 'probably_not';

export interface VerdictResult {
  verdict: Verdict;
  explanation: string;
  multiplier: number; // how many X of current data needed (1 = already enough)
  additionalSamples: number;
}

export function getVerdict(
  allSignificant: boolean,
  maxAdditionalSamples: number,
  maxRequiredN: number,
  maxCurrentN: number,
  winnerName?: string,
  significantLosers: number = 0,
): VerdictResult {
  if (allSignificant) {
    const winnerText = winnerName ? `${winnerName} is the winner.` : 'You can identify a winner.';
    return {
      verdict: 'yes',
      explanation: `${winnerText} The difference is statistically significant with enough data to be confident.`,
      multiplier: 1,
      additionalSamples: 0,
    };
  }

  const multiplier = maxCurrentN > 0 ? maxRequiredN / maxCurrentN : Infinity;
  const loserHint = significantLosers >= 2
    ? '\n{{LOSER_HINT}}'
    : '';

  if (!isFinite(maxAdditionalSamples)) {
    return {
      verdict: 'probably_not',
      explanation: `The differences between variants are too small to detect at this scale. Consider testing bolder changes or reducing the number of variants.${loserHint}`,
      multiplier: Infinity,
      additionalSamples: Infinity,
    };
  }

  if (multiplier > 10) {
    return {
      verdict: 'probably_not',
      explanation: `You'd need about ${multiplier.toFixed(0)}x your current data to confirm all current differences and choose a definite winner. Consider testing fewer variants or bolder changes.${loserHint}`,
      multiplier,
      additionalSamples: maxAdditionalSamples,
    };
  }

  return {
    verdict: 'not_yet',
    explanation: `You'd need about ${multiplier.toFixed(1)}x your current data to confirm all current differences and choose a definite winner. Keep running.${loserHint}`,
    multiplier,
    additionalSamples: maxAdditionalSamples,
  };
}

// ── Formatting helpers ───────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

export function formatDays(days: number): string {
  if (!isFinite(days)) return 'Not feasible';
  if (days < 1) return '<1 day';
  if (days <= 90) return `${Math.ceil(days)} days`;
  if (days <= 365) return `~${Math.round(days / 30)} months`;
  return `~${(days / 365).toFixed(1)} years`;
}
