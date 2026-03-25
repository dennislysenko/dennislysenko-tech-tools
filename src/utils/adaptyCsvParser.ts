/**
 * Parse an Adapty A/B test CSV export into evaluator state.
 *
 * Adapty has two CSV formats:
 *
 * 1. Cross A/B test (multi-variant):
 *    Columns include `variation` and `placement`.
 *    Each row = variation × placement × product.
 *
 * 2. Single A/B test (single-variant per paywall):
 *    No `variation` or `placement` columns.
 *    The `paywall` column identifies each variant.
 *    Each row = paywall × product.
 *
 * In both cases we aggregate per variant:
 *     - unique_profiles_views → usersExposed (max per variant, should be consistent)
 *     - trials               → trialStarts (sum per variant)
 *     - purchases            → purchases (sum per variant)
 *     - revenue              → totalRevenue (sum per variant)
 */

import type { VariantData, OutcomeVariable, ProductBreakdown } from '../components/ABTestEvaluator/types';

export interface AdaptyImportResult {
  variants: VariantData[];
  selectedVariables: OutcomeVariable[];
  variantCount: number;
  warnings: string[];
}

export interface AdaptyPlacementInfo {
  name: string;
  variations: string[];
  totalViews: number;
  hasData: boolean; // has any trials/purchases/revenue
}

function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

interface AdaptyRow {
  variation: string;
  placement: string;
  uniqueProfilesViews: number;
  trials: number;
  purchases: number;
  revenue: number;
}

type AdaptyFormat = 'cross' | 'single';

function parseRows(csvText: string): { header: string[]; rows: AdaptyRow[]; format: AdaptyFormat } | null {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const header = parseCSVRow(lines[0]);
  const col = (name: string) => header.indexOf(name);

  const variationIdx = col('variation');
  const placementIdx = col('placement');
  const paywallIdx = col('paywall');
  const viewsIdx = col('unique_profiles_views');
  const trialsIdx = col('trials');
  const purchasesIdx = col('purchases');
  const revenueIdx = col('revenue');

  if (viewsIdx === -1) return null;

  // Cross A/B test format: has variation + placement columns
  // Single A/B test format: no variation/placement, uses paywall as variant identifier
  const isCross = variationIdx !== -1 && placementIdx !== -1;
  const isSingle = !isCross && paywallIdx !== -1;

  if (!isCross && !isSingle) return null;

  const rows: AdaptyRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    rows.push({
      variation: isCross ? (fields[variationIdx] ?? '') : (fields[paywallIdx] ?? ''),
      placement: isCross ? (fields[placementIdx] ?? '') : '_single',
      uniqueProfilesViews: parseFloat(fields[viewsIdx]) || 0,
      trials: trialsIdx !== -1 ? (parseFloat(fields[trialsIdx]) || 0) : 0,
      purchases: purchasesIdx !== -1 ? (parseFloat(fields[purchasesIdx]) || 0) : 0,
      revenue: revenueIdx !== -1 ? (parseFloat(fields[revenueIdx]) || 0) : 0,
    });
  }

  return { header, rows, format: isCross ? 'cross' : 'single' };
}

/**
 * Detect if a CSV is Adapty format (either cross A/B or single A/B test).
 */
export function isAdaptyCSV(csvText: string): boolean {
  const firstLine = csvText.split(/\r?\n/)[0] ?? '';
  if (!firstLine.includes('unique_profiles_views')) return false;
  // Cross A/B test: has variation + placement
  if (firstLine.includes('variation') && firstLine.includes('placement')) return true;
  // Single A/B test: has paywall but no variation column
  if (firstLine.includes('paywall') && !firstLine.includes('variation')) return true;
  return false;
}

/**
 * Detect if an Adapty CSV is a single A/B test (no placement picker needed).
 */
export function isAdaptySingleTest(csvText: string): boolean {
  const parsed = parseRows(csvText);
  return parsed?.format === 'single';
}

/**
 * Parse a single-variant Adapty CSV directly (no placement selection needed).
 */
export function parseAdaptySingleCSV(csvText: string): AdaptyImportResult | null {
  return parseAdaptyCSV(csvText, '_single');
}

/**
 * Get available placements from an Adapty CSV, so the user can pick one.
 */
export function getAdaptyPlacements(csvText: string): AdaptyPlacementInfo[] {
  const parsed = parseRows(csvText);
  if (!parsed) return [];

  const placementMap = new Map<string, { variations: Set<string>; totalViews: number; hasData: boolean }>();

  for (const row of parsed.rows) {
    let info = placementMap.get(row.placement);
    if (!info) {
      info = { variations: new Set(), totalViews: 0, hasData: false };
      placementMap.set(row.placement, info);
    }
    info.variations.add(row.variation);
    info.totalViews = Math.max(info.totalViews, row.uniqueProfilesViews);
    if (row.trials > 0 || row.purchases > 0 || row.revenue > 0) {
      info.hasData = true;
    }
  }

  return Array.from(placementMap.entries()).map(([name, info]) => ({
    name,
    variations: Array.from(info.variations),
    totalViews: info.totalViews,
    hasData: info.hasData,
  }));
}

/**
 * Parse Adapty CSV for a specific placement into evaluator state.
 */
export function parseAdaptyCSV(csvText: string, placement: string): AdaptyImportResult | null {
  const parsed = parseRows(csvText);
  if (!parsed) return null;

  const placementRows = parsed.rows.filter((r) => r.placement === placement);
  if (placementRows.length === 0) return null;

  // Group by variation, track per-product data for std dev computation
  interface ProductData { purchases: number; revenue: number; }
  const variationMap = new Map<string, { views: number[]; trials: number; purchases: number; revenue: number; products: ProductData[] }>();

  for (const row of placementRows) {
    let agg = variationMap.get(row.variation);
    if (!agg) {
      agg = { views: [], trials: 0, purchases: 0, revenue: 0, products: [] };
      variationMap.set(row.variation, agg);
    }
    if (row.uniqueProfilesViews > 0) {
      agg.views.push(row.uniqueProfilesViews);
    }
    agg.trials += row.trials;
    agg.purchases += row.purchases;
    agg.revenue += row.revenue;
    if (row.purchases > 0) {
      agg.products.push({ purchases: row.purchases, revenue: row.revenue });
    }
  }

  const warnings: string[] = [];

  const variants: VariantData[] = Array.from(variationMap.entries()).map(([name, agg]) => {
    // Check if unique_profiles_views is consistent across products
    const uniqueViews = [...new Set(agg.views)];
    if (uniqueViews.length > 1) {
      warnings.push(`"${name}" has inconsistent user counts across products (${uniqueViews.join(', ')}). Using the highest value.`);
    }

    const n = Math.max(...agg.views, 0);
    const mean = n > 0 ? agg.revenue / n : 0;

    // Compute real std dev from per-product breakdown:
    // var = (Σ count_i × price_i²) / N - mean²
    // where price_i = revenue_i / purchases_i for each product
    let revenueStdDev: number | undefined;
    if (n > 0 && agg.products.length > 0) {
      let sumCountTimesPrice2 = 0;
      for (const p of agg.products) {
        const price = p.purchases > 0 ? p.revenue / p.purchases : 0;
        sumCountTimesPrice2 += p.purchases * price * price;
      }
      const variance = sumCountTimesPrice2 / n - mean * mean;
      revenueStdDev = Math.sqrt(Math.max(0, variance));
    }

    const productBreakdown: ProductBreakdown[] = agg.products
      .filter((p) => p.purchases > 0)
      .map((p) => ({ count: Math.round(p.purchases), pricePerUnit: p.revenue / p.purchases }));

    return {
      id: crypto.randomUUID(),
      name,
      usersExposed: n,
      trialStarts: Math.round(agg.trials),
      purchases: Math.round(agg.purchases),
      totalRevenue: Math.round(agg.revenue * 100) / 100,
      revenueStdDev,
      productBreakdown,
    };
  });

  if (variants.length < 2) return null;

  const selectedVariables: OutcomeVariable[] = [];
  if (variants.some((v) => v.trialStarts > 0)) selectedVariables.push('trialStarts');
  if (variants.some((v) => v.purchases > 0)) selectedVariables.push('purchases');
  if (variants.some((v) => v.totalRevenue > 0)) selectedVariables.push('ltv');
  if (selectedVariables.length === 0) selectedVariables.push('trialStarts');

  return {
    variants,
    selectedVariables,
    variantCount: variants.length,
    warnings,
  };
}
