import type { EvaluatorState, OutcomeVariable, VariantData } from './types';
import {
  proportionZTest,
  sampleSizeForProportion,
  additionalSamplesNeeded,
  bonferroniAlpha,
  getVerdict,
  type ProportionTestResult,
  type VerdictResult,
} from '../../utils/abTestStats';
import { bayesianRevenueTest, type BayesianResult } from '../../utils/bayesianRevenue';

export interface VariantResult {
  variantId: string;
  variantName: string;
  rate: number; // conversion rate or mean revenue
  liftPercent: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  samplesNeededToConfirm: number;
  additionalSamplesNeeded: number;
}

export interface BayesianVariantResult {
  variantId: string;
  variantName: string;
  revenuePer1K: number;
  credibleInterval: [number, number]; // 95% CI for revenue per 1K users
  p2bb: number;
  posteriorMean: number;
}

export interface VariableResult {
  variable: OutcomeVariable;
  verdict: VerdictResult;
  baselineId: string;
  baselineName: string;
  variantResults: VariantResult[];
  /** Bayesian results for LTV — present when product breakdown data is available */
  bayesian?: BayesianVariantResult[];
  isBayesian?: boolean;
}

function getRate(variant: VariantData, variable: OutcomeVariable): number {
  if (variant.usersExposed === 0) return 0;
  switch (variable) {
    case 'trialStarts':
      return variant.trialStarts / variant.usersExposed;
    case 'purchases':
      return variant.purchases / variant.usersExposed;
    case 'ltv':
      return variant.totalRevenue / variant.usersExposed;
  }
}

function getCount(variant: VariantData, variable: OutcomeVariable): number {
  switch (variable) {
    case 'trialStarts':
      return variant.trialStarts;
    case 'purchases':
      return variant.purchases;
    case 'ltv':
      return variant.totalRevenue;
  }
}


/**
 * Compute evaluation results for a single outcome variable.
 */
export function computeVariableResult(
  state: EvaluatorState,
  variable: OutcomeVariable,
): VariableResult {
  const { variants } = state;
  const numVariants = variants.length;
  const correctedAlpha = bonferroniAlpha(0.05, numVariants);

  // Determine baseline: explicit selection, or default to first variant (Variant A)
  const baseline =
    state.baselineVariantId
      ? variants.find((v) => v.id === state.baselineVariantId) ?? variants[0]
      : variants[0];

  const isBinary = variable !== 'ltv';
  const variantResults: VariantResult[] = [];
  let maxAdditional = 0;  // worst-case additional samples needed (across non-significant comparisons)
  let maxRequiredN = 0;   // worst-case required N
  let maxCurrentN = 0;

  for (const variant of variants) {
    if (variant.id === baseline.id) continue;

    maxCurrentN = Math.max(maxCurrentN, variant.usersExposed);

    if (isBinary) {
      const baselineCount = getCount(baseline, variable);
      const variantCount = getCount(variant, variable);
      const test: ProportionTestResult = proportionZTest(
        baselineCount,
        baseline.usersExposed,
        variantCount,
        variant.usersExposed,
        correctedAlpha,
      );

      const baseRate = test.p1;
      const observedLift = Math.abs(test.liftPercent);
      const requiredN =
        observedLift > 0
          ? sampleSizeForProportion(baseRate, observedLift, correctedAlpha, 0.8)
          : Infinity;
      const additional = additionalSamplesNeeded(
        Math.min(baseline.usersExposed, variant.usersExposed),
        requiredN,
      );

      if (!test.isSignificant) {
        if (additional > maxAdditional) maxAdditional = additional;
        if (requiredN > maxRequiredN) maxRequiredN = requiredN;
      }

      variantResults.push({
        variantId: variant.id,
        variantName: variant.name,
        rate: test.p2,
        liftPercent: test.liftPercent,
        confidenceInterval: test.confidenceInterval,
        pValue: test.pValue,
        isSignificant: test.isSignificant,
        samplesNeededToConfirm: requiredN,
        additionalSamplesNeeded: additional,
      });
    } else {
      // LTV — handled via Bayesian model below, skip per-variant frequentist
      continue;
    }
  }

  // For LTV with product data: use Bayesian two-part model
  if (variable === 'ltv') {
    const hasProductData = variants.some((v) => v.productBreakdown && v.productBreakdown.length > 0);

    if (hasProductData) {
      const bayesInputs = variants.map((v) => ({
        usersExposed: v.usersExposed,
        purchases: v.purchases,
        products: (v.productBreakdown ?? []).map((p) => ({ count: p.count, pricePerUnit: p.pricePerUnit })),
      }));

      const bayesResults = bayesianRevenueTest(bayesInputs);

      const bayesianVariantResults: BayesianVariantResult[] = variants.map((v, idx) => ({
        variantId: v.id,
        variantName: v.name,
        revenuePer1K: bayesResults[idx].revenuePer1K,
        credibleInterval: bayesResults[idx].credibleInterval,
        p2bb: bayesResults[idx].p2bb,
        posteriorMean: bayesResults[idx].posteriorMean,
      }));

      // Sort by revenue (descending) to find top two
      const sorted = [...bayesianVariantResults].sort((a, b) => b.revenuePer1K - a.revenuePer1K);
      const best = sorted[0];
      const secondBest = sorted[1];

      // Check if best variant's CI lower bound is above second-best's CI upper bound
      const cisSeparated = best && secondBest
        ? best.credibleInterval[0] > secondBest.credibleInterval[1]
        : false;

      // Estimate how much more data needed for CIs to separate
      // CI width scales as ~1/√N. We need: best_lower > second_upper
      // Current gap = best_lower - second_upper (negative if overlapping)
      // Current avg CI width ≈ (best_width + second_width) / 2
      let dataMultiplier = 0;
      if (best && secondBest && !cisSeparated) {
        const bestWidth = best.credibleInterval[1] - best.credibleInterval[0];
        const secondWidth = secondBest.credibleInterval[1] - secondBest.credibleInterval[0];
        const avgWidth = (bestWidth + secondWidth) / 2;
        const overlap = secondBest.credibleInterval[1] - best.credibleInterval[0];
        if (avgWidth > 0 && overlap > 0) {
          // Need to shrink CIs by factor of (overlap / avgWidth + 1)
          // Since CI width ∝ 1/√N, need N × (shrinkFactor)²
          const shrinkFactor = 1 + overlap / avgWidth;
          dataMultiplier = Math.ceil(shrinkFactor * shrinkFactor);
        }
      }

      let bayesVerdict: VerdictResult;
      if (cisSeparated) {
        bayesVerdict = {
          verdict: 'yes',
          explanation: `${best.variantName} is the winner. Its credible interval ($${best.credibleInterval[0].toFixed(0)}–$${best.credibleInterval[1].toFixed(0)} per 1K users) is fully above the next best variant.`,
          multiplier: 1,
          additionalSamples: 0,
        };
      } else if (dataMultiplier > 0) {
        bayesVerdict = {
          verdict: dataMultiplier > 10 ? 'probably_not' : 'not_yet',
          explanation: `The credible intervals still overlap. You'd need about ${dataMultiplier}x your current data for the top variants to separate. Keep running.`,
          multiplier: dataMultiplier,
          additionalSamples: 0,
        };
      } else {
        bayesVerdict = {
          verdict: 'not_yet',
          explanation: 'Not enough data to distinguish variants on revenue. Keep running.',
          multiplier: 0,
          additionalSamples: 0,
        };
      }

      return {
        variable,
        verdict: bayesVerdict,
        baselineId: baseline.id,
        baselineName: baseline.name,
        variantResults: [],
        bayesian: bayesianVariantResults,
        isBayesian: true,
      };
    }

    // Fallback: no product data, can't do Bayesian
    return {
      variable,
      verdict: {
        verdict: 'not_yet',
        explanation: 'Import a CSV with per-product data (RevenueCat or Adapty) for accurate LTV analysis.',
        multiplier: 0,
        additionalSamples: 0,
      },
      baselineId: baseline.id,
      baselineName: baseline.name,
      variantResults: [],
    };
  }

  // Can only declare a winner if ALL other variants are significantly worse than the baseline
  const allSignificant = variantResults.length > 0 && variantResults.every((vr) => vr.isSignificant);

  // Count significant losers for the suggestion to remove them
  const significantLosers = variantResults.filter((vr) => vr.isSignificant).length;

  const verdict = getVerdict(allSignificant, maxAdditional, maxRequiredN, maxCurrentN, baseline.name, significantLosers);

  return {
    variable,
    verdict,
    baselineId: baseline.id,
    baselineName: baseline.name,
    variantResults,
  };
}

/**
 * Compute results for all selected variables.
 */
export function computeAllResults(state: EvaluatorState): VariableResult[] {
  return state.selectedVariables.map((v) => computeVariableResult(state, v));
}
