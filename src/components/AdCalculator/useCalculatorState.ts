import { useReducer, useEffect, useState } from 'react';
import type { CalculatorState, CalculatorAction, NumericField, MonetizationMode } from './types';
import { getInitialState, recalculate, isDerivedField } from './defaults';

const STORAGE_KEY = 'ad-calculator-state';

type InternalAction = CalculatorAction | { type: 'RESTORE'; state: CalculatorState };

function loadSavedState(): CalculatorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved && typeof saved.model === 'string' && typeof saved.cpt === 'number') {
      // Backwards compat: add monetizationMode and trialConversionRate if missing
      if (!saved.monetizationMode) {
        saved.monetizationMode = 'trials';
      }
      if (typeof saved.trialConversionRate !== 'number') {
        saved.trialConversionRate = saved.trialStartRate > 0
          ? saved.installToPayingRate / saved.trialStartRate
          : 0;
      }
      if (typeof saved.kFactor !== 'number') {
        saved.kFactor = 0;
      }
      if (typeof saved.adjustedRoas !== 'number') {
        saved.adjustedRoas = 0;
      }
      return saved as CalculatorState;
    }
  } catch {
    // Ignore corrupt data
  }
  return null;
}

function saveState(state: CalculatorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function reducer(state: CalculatorState, action: InternalAction): CalculatorState {
  switch (action.type) {
    case 'RESTORE': {
      return action.state;
    }
    case 'SET_MODEL': {
      return getInitialState(action.model);
    }
    case 'SET_MONETIZATION_MODE': {
      const next = { ...state, monetizationMode: action.mode };
      // Clear locks on trial-only fields when leaving trials mode
      if (action.mode !== 'trials') {
        const nextLocked = { ...next.locked };
        delete nextLocked.trialStartRate;
        delete nextLocked.trialConversionRate;
        delete nextLocked.costPerTrialStart;
        next.locked = nextLocked;
      }
      return recalculate(next);
    }
    case 'SET_FIELD': {
      const next = { ...state, [action.field]: action.value };
      if (isDerivedField(action.field)) {
        next.locked = { ...next.locked, [action.field]: true };
      }
      return recalculate(next, action.field);
    }
    case 'TOGGLE_LOCK': {
      const next = { ...state, locked: { ...state.locked } };
      if (next.locked[action.field]) {
        delete next.locked[action.field];
        return recalculate(next);
      } else {
        next.locked[action.field] = true;
        return next;
      }
    }
    case 'RESET_ALL': {
      clearSavedState();
      return getInitialState(state.model);
    }
    default:
      return state;
  }
}

export function useCalculatorState() {
  const [state, dispatch] = useReducer(reducer, null, () => getInitialState('cpt'));
  const [hydrated, setHydrated] = useState(false);

  // After hydration, restore saved state from localStorage
  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      dispatch({ type: 'RESTORE', state: saved });
    }
    setHydrated(true);
  }, []);

  // Persist state to localStorage after hydration
  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  const setModel = (model: 'cpm' | 'cpt') =>
    dispatch({ type: 'SET_MODEL', model });

  const setMonetizationMode = (mode: MonetizationMode) =>
    dispatch({ type: 'SET_MONETIZATION_MODE', mode });

  const setField = (field: NumericField, value: number) =>
    dispatch({ type: 'SET_FIELD', field, value });

  const toggleLock = (field: NumericField) =>
    dispatch({ type: 'TOGGLE_LOCK', field });

  const resetAll = () =>
    dispatch({ type: 'RESET_ALL' });

  return { state, setModel, setMonetizationMode, setField, toggleLock, resetAll };
}
