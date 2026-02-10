import type { CalculatorState, NumericField } from './types';

export const CPM_DEFAULTS = {
  cpm: 10.0,
  tapThroughRate: 0.015,
} as const;

export const CPT_DEFAULTS = {
  cpt: 2.0,
} as const;

export const COMMON_DEFAULTS = {
  conversionRate: 0.3,
  trialStartRate: 0.10,
  trialConversionRate: 0.50,
  installToPayingRate: 0.05,
  revenuePerSubscriber: 50.0,
  kFactor: 0.3,
} as const;

// --- Equation-based constraint solver ---

interface Equation {
  fields: NumericField[];
  defaultOutput: NumericField;
  solve: Record<string, (s: CalculatorState) => number>;
  cpmOnly?: boolean;
  trialsOnly?: boolean;
}

const EQUATIONS: Equation[] = [
  {
    // CPT = CPM / (1000 * TTR)
    fields: ['cpt', 'cpm', 'tapThroughRate'],
    defaultOutput: 'cpt',
    cpmOnly: true,
    solve: {
      cpt: (s) => s.tapThroughRate > 0 ? s.cpm / (1000 * s.tapThroughRate) : 0,
      cpm: (s) => s.cpt * 1000 * s.tapThroughRate,
      tapThroughRate: (s) => s.cpt > 0 ? s.cpm / (1000 * s.cpt) : 0,
    },
  },
  {
    // CPA = CPT / conversionRate
    fields: ['cpa', 'cpt', 'conversionRate'],
    defaultOutput: 'cpa',
    solve: {
      cpa: (s) => s.conversionRate > 0 ? s.cpt / s.conversionRate : 0,
      cpt: (s) => s.cpa * s.conversionRate,
      conversionRate: (s) => s.cpa > 0 ? s.cpt / s.cpa : 0,
    },
  },
  {
    // installToPayingRate = trialStartRate × trialConversionRate
    fields: ['installToPayingRate', 'trialStartRate', 'trialConversionRate'],
    defaultOutput: 'installToPayingRate',
    trialsOnly: true,
    solve: {
      installToPayingRate: (s) => s.trialStartRate * s.trialConversionRate,
      trialStartRate: (s) => s.trialConversionRate > 0 ? s.installToPayingRate / s.trialConversionRate : 0,
      trialConversionRate: (s) => s.trialStartRate > 0 ? s.installToPayingRate / s.trialStartRate : 0,
    },
  },
  {
    // costPerTrialStart = CPA / trialStartRate
    fields: ['costPerTrialStart', 'cpa', 'trialStartRate'],
    defaultOutput: 'costPerTrialStart',
    trialsOnly: true,
    solve: {
      costPerTrialStart: (s) => s.trialStartRate > 0 ? s.cpa / s.trialStartRate : 0,
      cpa: (s) => s.costPerTrialStart * s.trialStartRate,
      trialStartRate: (s) => s.costPerTrialStart > 0 ? s.cpa / s.costPerTrialStart : 0,
    },
  },
  {
    // costPerSubscriber = CPA / installToPayingRate
    fields: ['costPerSubscriber', 'cpa', 'installToPayingRate'],
    defaultOutput: 'costPerSubscriber',
    solve: {
      costPerSubscriber: (s) => s.installToPayingRate > 0 ? s.cpa / s.installToPayingRate : 0,
      cpa: (s) => s.costPerSubscriber * s.installToPayingRate,
      installToPayingRate: (s) => s.costPerSubscriber > 0 ? s.cpa / s.costPerSubscriber : 0,
    },
  },
  {
    // revenuePerInstall = revenuePerSubscriber * installToPayingRate
    fields: ['revenuePerInstall', 'revenuePerSubscriber', 'installToPayingRate'],
    defaultOutput: 'revenuePerInstall',
    solve: {
      revenuePerInstall: (s) => s.revenuePerSubscriber * s.installToPayingRate,
      revenuePerSubscriber: (s) => s.installToPayingRate > 0 ? s.revenuePerInstall / s.installToPayingRate : 0,
      installToPayingRate: (s) => s.revenuePerSubscriber > 0 ? s.revenuePerInstall / s.revenuePerSubscriber : 0,
    },
  },
];

/** Set of fields that are the defaultOutput of some equation */
const DERIVED_FIELDS = new Set<NumericField>(
  EQUATIONS.map((eq) => eq.defaultOutput)
);

export function isDerivedField(field: NumericField): boolean {
  return DERIVED_FIELDS.has(field);
}

export function getInitialState(model: 'cpm' | 'cpt' = 'cpt'): CalculatorState {
  const base: CalculatorState = {
    model,
    monetizationMode: 'trials',
    cpm: CPM_DEFAULTS.cpm,
    tapThroughRate: CPM_DEFAULTS.tapThroughRate,
    cpt: model === 'cpt' ? CPT_DEFAULTS.cpt : 0,
    conversionRate: COMMON_DEFAULTS.conversionRate,
    cpa: 0,
    trialStartRate: COMMON_DEFAULTS.trialStartRate,
    trialConversionRate: COMMON_DEFAULTS.trialConversionRate,
    installToPayingRate: COMMON_DEFAULTS.installToPayingRate,
    costPerTrialStart: 0,
    costPerSubscriber: 0,
    revenuePerSubscriber: COMMON_DEFAULTS.revenuePerSubscriber,
    revenuePerInstall: 0,
    kFactor: COMMON_DEFAULTS.kFactor,
    roas: 0,
    adjustedRoas: 0,
    locked: {},
  };

  return recalculate(base);
}

export function recalculate(
  state: CalculatorState,
  editedField?: NumericField,
): CalculatorState {
  const s = { ...state };
  const fixed = new Set<NumericField>();

  // Locked fields are fixed
  for (const f of Object.keys(s.locked) as NumericField[]) {
    if (s.locked[f]) fixed.add(f);
  }

  // The field the user just edited is temporarily fixed
  if (editedField) fixed.add(editedField);

  const activeEquations = EQUATIONS.filter(
    (eq) => (!eq.cpmOnly || s.model === 'cpm') &&
            (!eq.trialsOnly || s.monetizationMode === 'trials'),
  );

  // Phase 1: Constraint propagation — solve equations with exactly 1 free variable
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const eq of activeEquations) {
      const freeFields = eq.fields.filter((f) => !fixed.has(f));
      if (freeFields.length !== 1) continue;
      const target = freeFields[0];
      const newVal = eq.solve[target](s);
      if (s[target] !== newVal) {
        s[target] = newVal;
        changed = true;
      }
      fixed.add(target);
    }
    if (!changed) break;
  }

  // Phase 2: Forward pass — compute default outputs for remaining unsolved equations
  for (const eq of activeEquations) {
    const output = eq.defaultOutput;
    if (fixed.has(output)) {
      // Default output is fixed; solve for the first free input to keep consistency
      const freeInputs = eq.fields.filter(
        (f) => f !== output && !fixed.has(f),
      );
      if (freeInputs.length >= 1) {
        s[freeInputs[0]] = eq.solve[freeInputs[0]](s);
        fixed.add(freeInputs[0]);
      }
      continue;
    }
    s[output] = eq.solve[output](s);
    fixed.add(output);
  }

  // ROAS: always derived, never locked. 0x = breakeven, positive = profit, negative = loss.
  s.roas = s.cpa > 0 ? (s.revenuePerInstall / s.cpa) - 1 : 0;
  s.adjustedRoas = s.cpa > 0 ? (s.revenuePerInstall * (1 + s.kFactor) / s.cpa) - 1 : 0;

  return s;
}
