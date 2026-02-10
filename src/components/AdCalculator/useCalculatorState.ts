import { useReducer, useEffect, useState, useCallback } from 'react';
import type { CalculatorState, CalculatorAction, NumericField, MonetizationMode } from './types';
import { getInitialState, recalculate, isDerivedField } from './defaults';

const STORAGE_KEY = 'ad-calculator-state';

type InternalAction = CalculatorAction | { type: 'RESTORE'; state: CalculatorState };

function applyBackwardsCompat(saved: Record<string, unknown>): void {
  if (!saved.monetizationMode) {
    saved.monetizationMode = 'trials';
  }
  if (typeof saved.trialConversionRate !== 'number') {
    saved.trialConversionRate = (saved.trialStartRate as number) > 0
      ? (saved.installToPayingRate as number) / (saved.trialStartRate as number)
      : 0;
  }
  if (typeof saved.kFactor !== 'number') {
    saved.kFactor = 0;
  }
  if (typeof saved.adjustedRoas !== 'number') {
    saved.adjustedRoas = 0;
  }
}

function loadStateFromUrl(): CalculatorState | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#s=')) return null;
    const json = atob(hash.slice(3));
    const saved = JSON.parse(json);
    if (saved && typeof saved.model === 'string' && typeof saved.cpt === 'number') {
      applyBackwardsCompat(saved);
      // Clear the hash so it doesn't stick around on subsequent edits
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return recalculate(saved as CalculatorState);
    }
  } catch {
    // Ignore bad URL data
  }
  return null;
}

function loadSavedState(): CalculatorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved && typeof saved.model === 'string' && typeof saved.cpt === 'number') {
      applyBackwardsCompat(saved);
      return saved as CalculatorState;
    }
  } catch {
    // Ignore corrupt data
  }
  return null;
}

function encodeStateToHash(state: CalculatorState): string {
  const { roas, adjustedRoas, ...rest } = state;
  return '#s=' + btoa(JSON.stringify(rest));
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

  // After hydration, restore state: URL takes priority over localStorage
  useEffect(() => {
    const fromUrl = loadStateFromUrl();
    if (fromUrl) {
      dispatch({ type: 'RESTORE', state: fromUrl });
    } else {
      const saved = loadSavedState();
      if (saved) {
        dispatch({ type: 'RESTORE', state: saved });
      }
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

  const copyShareLink = useCallback(async () => {
    const url = window.location.origin + window.location.pathname + encodeStateToHash(state);
    await navigator.clipboard.writeText(url);
    return url;
  }, [state]);

  return { state, setModel, setMonetizationMode, setField, toggleLock, resetAll, copyShareLink };
}
