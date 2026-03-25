/**
 * Parse a RevenueCat experiment CSV export into evaluator state.
 *
 * Expected CSV format:
 *   Header: "Metric","Product","Variant A","Variant B",...,"Variant B Change",...
 *   Rows with Product="All" contain the aggregate data we need:
 *     - "Customers"              → usersExposed
 *     - "Trials started"         → trialStarts
 *     - "Paid customers"         → purchases
 *     - "Realized LTV (revenue)" → totalRevenue
 */

import type { VariantData, OutcomeVariable, ProductBreakdown } from '../components/ABTestEvaluator/types';

export interface RCImportResult {
  variants: VariantData[];
  selectedVariables: OutcomeVariable[];
  variantCount: number;
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
          i++; // skip escaped quote
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

export function parseRevenueCatCSV(csvText: string): RCImportResult | null {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  // Parse header to find variant columns
  const header = parseCSVRow(lines[0]);
  // Header: "Metric", "Product", "Variant A", "Variant B", ..., "Variant B Change", ...
  // Variant columns are after "Product" and before the first "Change" column
  const metricIdx = header.indexOf('Metric');
  const productIdx = header.indexOf('Product');
  if (metricIdx === -1 || productIdx === -1) return null;

  // Find variant columns: columns after Product that don't contain "Change"
  const variantColumns: { index: number; name: string }[] = [];
  for (let i = productIdx + 1; i < header.length; i++) {
    if (header[i].includes('Change')) break;
    variantColumns.push({ index: i, name: header[i] });
  }

  if (variantColumns.length < 2) return null;

  // Parse all data rows
  const allRows = new Map<string, string[]>(); // "metric|product" → [variant values]
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    const metric = fields[metricIdx];
    const product = fields[productIdx];
    const key = `${metric}|${product}`;
    allRows.set(key, variantColumns.map((vc) => fields[vc.index] ?? '0'));
  }

  // Extract aggregate data (Product="All")
  const customers = allRows.get('Customers|All');
  const trialsStarted = allRows.get('Trials started|All');
  const paidCustomers = allRows.get('Paid customers|All');
  const realizedLTV = allRows.get('Realized LTV (revenue)|All');

  if (!customers) return null; // Must at least have customers

  // Collect per-product data for std dev computation
  // Find all product-level rows for "Paid customers" and "Realized LTV (revenue)"
  const productNames: string[] = [];
  for (const key of allRows.keys()) {
    if (key.startsWith('Paid customers|') && !key.endsWith('|All')) {
      productNames.push(key.split('|')[1]);
    }
  }

  // Build variant data with real std dev
  const variants: VariantData[] = variantColumns.map((vc, i) => {
    const n = parseFloat(customers[i]) || 0;
    const totalRev = realizedLTV ? (parseFloat(realizedLTV[i]) || 0) : 0;
    const mean = n > 0 ? totalRev / n : 0;

    // Compute real std dev and product breakdown from per-product data
    let revenueStdDev: number | undefined;
    const productBreakdown: ProductBreakdown[] = [];
    if (n > 0 && productNames.length > 0) {
      let sumCountTimesPrice2 = 0;
      for (const prod of productNames) {
        const prodPurchases = parseFloat((allRows.get(`Paid customers|${prod}`) ?? [])[i] ?? '0') || 0;
        const prodRevenue = parseFloat((allRows.get(`Realized LTV (revenue)|${prod}`) ?? [])[i] ?? '0') || 0;
        if (prodPurchases > 0) {
          const price = prodRevenue / prodPurchases;
          sumCountTimesPrice2 += prodPurchases * price * price;
          productBreakdown.push({ count: prodPurchases, pricePerUnit: price });
        }
      }
      const variance = sumCountTimesPrice2 / n - mean * mean;
      revenueStdDev = Math.sqrt(Math.max(0, variance));
    }

    return {
      id: crypto.randomUUID(),
      name: vc.name,
      usersExposed: n,
      trialStarts: trialsStarted ? (parseFloat(trialsStarted[i]) || 0) : 0,
      purchases: paidCustomers ? (parseFloat(paidCustomers[i]) || 0) : 0,
      totalRevenue: totalRev,
      revenueStdDev,
      productBreakdown,
    };
  });

  // Determine which variables have data
  const selectedVariables: OutcomeVariable[] = [];
  if (trialsStarted && variants.some((v) => v.trialStarts > 0)) {
    selectedVariables.push('trialStarts');
  }
  if (paidCustomers && variants.some((v) => v.purchases > 0)) {
    selectedVariables.push('purchases');
  }
  if (realizedLTV && variants.some((v) => v.totalRevenue > 0)) {
    selectedVariables.push('ltv');
  }

  // Default to trialStarts if nothing detected
  if (selectedVariables.length === 0) {
    selectedVariables.push('trialStarts');
  }

  return {
    variants,
    selectedVariables,
    variantCount: variants.length,
  };
}
