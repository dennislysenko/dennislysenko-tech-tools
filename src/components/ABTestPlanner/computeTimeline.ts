import type { PlannerState, TimelineRow, TimelineCell } from './types';
import {
  sampleSizeForProportion,
  sampleSizeForMean,
  bonferroniAlpha,
} from '../../utils/abTestStats';

function computeCell(
  samplesPerVariant: number,
  dailySamplesPerVariant: number,
): TimelineCell {
  const daysNeeded = dailySamplesPerVariant > 0
    ? samplesPerVariant / dailySamplesPerVariant
    : Infinity;

  let feasibility: TimelineCell['feasibility'];
  if (daysNeeded <= 30) feasibility = 'easy';
  else if (daysNeeded <= 90) feasibility = 'moderate';
  else if (daysNeeded <= 180) feasibility = 'hard';
  else feasibility = 'infeasible';

  return { daysNeeded, samplesPerVariant, feasibility };
}

export function computeTimeline(state: PlannerState): TimelineRow[] {
  const { dailyPaywallViews, trialStartRate, purchaseRate, averageRevenue, variantCount } = state;

  if (dailyPaywallViews <= 0) return [];

  const correctedAlpha = bonferroniAlpha(0.05, variantCount);
  const dailyViewsPerVariant = dailyPaywallViews / variantCount;

  const rows: TimelineRow[] = [];

  // Trial Starts
  if (trialStartRate > 0) {
    const lifts = [10, 20, 50];
    const cells = lifts.map((lift) => {
      const n = sampleSizeForProportion(trialStartRate, lift, correctedAlpha, 0.8);
      return computeCell(n, dailyViewsPerVariant);
    });
    rows.push({
      variable: 'Trial Starts',
      variableKey: 'trialStarts',
      lift10: cells[0],
      lift20: cells[1],
      lift50: cells[2],
    });
  }

  // Purchases (from paywall viewers → purchasers)
  if (purchaseRate > 0) {
    const lifts = [10, 20, 50];
    const cells = lifts.map((lift) => {
      const n = sampleSizeForProportion(purchaseRate, lift, correctedAlpha, 0.8);
      return computeCell(n, dailyViewsPerVariant);
    });
    rows.push({
      variable: 'Purchases',
      variableKey: 'purchases',
      lift10: cells[0],
      lift20: cells[1],
      lift50: cells[2],
    });
  }

  // LTV (revenue per purchaser)
  if (averageRevenue > 0 && purchaseRate > 0) {
    const lifts = [10, 20, 50];
    // For LTV, we need purchasers, not just paywall viewers
    const dailyPurchasersPerVariant = dailyViewsPerVariant * purchaseRate;
    const cells = lifts.map((lift) => {
      const n = sampleSizeForMean(averageRevenue, lift, correctedAlpha, 0.8);
      return computeCell(n, dailyPurchasersPerVariant);
    });
    rows.push({
      variable: 'LTV (Revenue)',
      variableKey: 'ltv',
      lift10: cells[0],
      lift20: cells[1],
      lift50: cells[2],
    });
  }

  return rows;
}
