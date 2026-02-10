export type AdModel = 'cpm' | 'cpt';

export type MonetizationMode = 'trials' | 'noTrials' | 'mixed';

export type NumericField =
  | 'cpm'
  | 'tapThroughRate'
  | 'cpt'
  | 'conversionRate'
  | 'cpa'
  | 'trialStartRate'
  | 'trialConversionRate'
  | 'installToPayingRate'
  | 'costPerTrialStart'
  | 'costPerSubscriber'
  | 'revenuePerSubscriber'
  | 'revenuePerInstall'
  | 'kFactor';

export interface CalculatorState {
  model: AdModel;
  monetizationMode: MonetizationMode;
  cpm: number;
  tapThroughRate: number;
  cpt: number;
  conversionRate: number;
  cpa: number;
  trialStartRate: number;
  trialConversionRate: number;
  installToPayingRate: number;
  costPerTrialStart: number;
  costPerSubscriber: number;
  revenuePerSubscriber: number;
  revenuePerInstall: number;
  kFactor: number;
  roas: number;
  adjustedRoas: number;
  locked: Partial<Record<NumericField, boolean>>;
}

export type CalculatorAction =
  | { type: 'SET_MODEL'; model: AdModel }
  | { type: 'SET_MONETIZATION_MODE'; mode: MonetizationMode }
  | { type: 'SET_FIELD'; field: NumericField; value: number }
  | { type: 'TOGGLE_LOCK'; field: NumericField }
  | { type: 'RESET_ALL' };

export interface FieldConfig {
  field: NumericField;
  label: string;
  unit: '$' | '%' | '×';
  description?: string;
  derivedFrom?: string;
  cpmOnly?: boolean;
  trialsOnly?: boolean;
}
