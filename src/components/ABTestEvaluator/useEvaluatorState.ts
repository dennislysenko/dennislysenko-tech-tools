import { useReducer, useEffect, useState, useCallback } from 'react';
import type { EvaluatorState, EvaluatorAction, VariantData } from './types';

const STORAGE_KEY = 'ab-test-evaluator-state';
const VARIANT_LETTERS = 'ABCDEFGH';

function makeVariant(index: number): VariantData {
  return {
    id: crypto.randomUUID(),
    name: `Variant ${VARIANT_LETTERS[index] ?? index + 1}`,
    usersExposed: 0,
    trialStarts: 0,
    purchases: 0,
    totalRevenue: 0,
  };
}

function getInitialState(): EvaluatorState {
  return {
    variantCount: 2,
    variants: [makeVariant(0), makeVariant(1)],
    selectedVariables: ['trialStarts'],
    activeResultTab: 'trialStarts',
    baselineVariantId: null,
    daysRunning: 0,
  };
}

type InternalAction = EvaluatorAction | { type: 'RESTORE'; state: EvaluatorState };

function reducer(state: EvaluatorState, action: InternalAction): EvaluatorState {
  switch (action.type) {
    case 'RESTORE':
      return action.state;

    case 'SET_VARIANT_COUNT': {
      const count = Math.max(2, Math.min(8, action.count));
      const variants = [...state.variants];
      while (variants.length < count) {
        variants.push(makeVariant(variants.length));
      }
      while (variants.length > count) {
        variants.pop();
      }
      return { ...state, variantCount: count, variants };
    }

    case 'UPDATE_VARIANT': {
      const variants = state.variants.map((v) => {
        if (v.id !== action.id) return v;
        return { ...v, [action.field]: action.value };
      });
      return { ...state, variants };
    }

    case 'ADD_VARIANT': {
      if (state.variants.length >= 8) return state;
      const variants = [...state.variants, makeVariant(state.variants.length)];
      return { ...state, variantCount: variants.length, variants };
    }

    case 'DELETE_VARIANT': {
      if (state.variants.length <= 2) return state;
      const variants = state.variants.filter((v) => v.id !== action.id);
      const baselineVariantId =
        state.baselineVariantId === action.id ? null : state.baselineVariantId;
      return { ...state, variantCount: variants.length, variants, baselineVariantId };
    }

    case 'TOGGLE_VARIABLE': {
      const has = state.selectedVariables.includes(action.variable);
      let selected: typeof state.selectedVariables;
      if (has && state.selectedVariables.length > 1) {
        selected = state.selectedVariables.filter((v) => v !== action.variable);
      } else if (!has) {
        selected = [...state.selectedVariables, action.variable];
      } else {
        return state; // Can't uncheck the last one
      }
      const activeResultTab = selected.includes(state.activeResultTab)
        ? state.activeResultTab
        : selected[0];
      return { ...state, selectedVariables: selected, activeResultTab };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeResultTab: action.tab };

    case 'SET_BASELINE':
      return { ...state, baselineVariantId: action.id };

    case 'IMPORT_RC_CSV':
      return {
        ...state,
        variants: action.variants,
        variantCount: action.variantCount,
        selectedVariables: action.selectedVariables,
        activeResultTab: action.selectedVariables[0],
        baselineVariantId: null,
        daysRunning: 0,
      };

    case 'SET_DAYS_RUNNING':
      return { ...state, daysRunning: action.days };

    case 'RESET_ALL':
      clearSavedState();
      return getInitialState();

    default:
      return state;
  }
}

function loadStateFromUrl(): EvaluatorState | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#s=')) return null;
    const json = atob(hash.slice(3));
    const saved = JSON.parse(json);
    if (saved && Array.isArray(saved.variants)) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return saved as EvaluatorState;
    }
  } catch {
    // ignore
  }
  return null;
}

function loadSavedState(): EvaluatorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.variants)) {
      return saved as EvaluatorState;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveState(state: EvaluatorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function encodeStateToHash(state: EvaluatorState): string {
  return '#s=' + btoa(JSON.stringify(state));
}

export function useEvaluatorState() {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);
  const [hydrated, setHydrated] = useState(false);

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

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const copyShareLink = useCallback(async () => {
    const url =
      window.location.origin + window.location.pathname + encodeStateToHash(state);
    await navigator.clipboard.writeText(url);
    return url;
  }, [state]);

  return { state, dispatch, copyShareLink };
}
