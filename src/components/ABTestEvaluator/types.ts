export type OutcomeVariable = 'trialStarts' | 'purchases' | 'ltv';

export const OUTCOME_LABELS: Record<OutcomeVariable, string> = {
  trialStarts: 'Trial Starts',
  purchases: 'Purchases',
  ltv: 'LTV (Revenue)',
};

export const OUTCOME_DESCRIPTIONS: Record<OutcomeVariable, string> = {
  trialStarts: 'Number of users who started a free trial',
  purchases: 'Number of users who made a purchase',
  ltv: 'Total revenue from this variant',
};

export interface ProductBreakdown {
  count: number;
  pricePerUnit: number;
}

export interface VariantData {
  id: string;
  name: string;
  usersExposed: number;
  trialStarts: number;
  purchases: number;
  totalRevenue: number;
  revenueStdDev?: number; // computed from per-product data when available
  productBreakdown?: ProductBreakdown[]; // per-product purchase data for Bayesian model
}

export interface EvaluatorState {
  variantCount: number;
  variants: VariantData[];
  selectedVariables: OutcomeVariable[];
  activeResultTab: OutcomeVariable;
  baselineVariantId: string | null; // null = best performer (auto)
  daysRunning: number; // 0 = not set
}

export type EvaluatorAction =
  | { type: 'SET_VARIANT_COUNT'; count: number }
  | { type: 'UPDATE_VARIANT'; id: string; field: keyof VariantData; value: number | string }
  | { type: 'ADD_VARIANT' }
  | { type: 'DELETE_VARIANT'; id: string }
  | { type: 'TOGGLE_VARIABLE'; variable: OutcomeVariable }
  | { type: 'SET_ACTIVE_TAB'; tab: OutcomeVariable }
  | { type: 'SET_BASELINE'; id: string | null }
  | { type: 'RESET_ALL' }
  | { type: 'RESTORE'; state: EvaluatorState }
  | { type: 'IMPORT_RC_CSV'; variants: VariantData[]; selectedVariables: OutcomeVariable[]; variantCount: number }
  | { type: 'SET_DAYS_RUNNING'; days: number };
