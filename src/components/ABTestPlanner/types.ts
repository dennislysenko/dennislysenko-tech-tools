export interface PlannerState {
  dailyPaywallViews: number;
  trialStartRate: number;  // as decimal (0.10 = 10%)
  purchaseRate: number;    // as decimal
  averageRevenue: number;  // average revenue per paying user
  variantCount: number;    // 2-8
}

export type PlannerAction =
  | { type: 'SET_FIELD'; field: keyof PlannerState; value: number }
  | { type: 'SET_VARIANT_COUNT'; count: number }
  | { type: 'RESET_ALL' }
  | { type: 'RESTORE'; state: PlannerState };

export interface TimelineCell {
  daysNeeded: number;
  samplesPerVariant: number;
  feasibility: 'easy' | 'moderate' | 'hard' | 'infeasible';
}

export interface TimelineRow {
  variable: string;
  variableKey: string;
  lift10: TimelineCell;
  lift20: TimelineCell;
  lift50: TimelineCell;
}
