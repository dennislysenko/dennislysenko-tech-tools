import { useReducer, useEffect, useState, useCallback } from 'react';
import type { PlannerState, PlannerAction } from './types';

const STORAGE_KEY = 'ab-test-planner-state';

function getInitialState(): PlannerState {
  return {
    dailyPaywallViews: 0,
    trialStartRate: 0,
    purchaseRate: 0,
    averageRevenue: 0,
    variantCount: 2,
  };
}

type InternalAction = PlannerAction | { type: 'RESTORE'; state: PlannerState };

function reducer(state: PlannerState, action: InternalAction): PlannerState {
  switch (action.type) {
    case 'RESTORE':
      return action.state;

    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_VARIANT_COUNT':
      return { ...state, variantCount: Math.max(2, Math.min(8, action.count)) };

    case 'RESET_ALL':
      clearSavedState();
      return getInitialState();

    default:
      return state;
  }
}

function loadStateFromUrl(): PlannerState | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#s=')) return null;
    const json = atob(hash.slice(3));
    const saved = JSON.parse(json);
    if (saved && typeof saved.dailyPaywallViews === 'number') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return saved as PlannerState;
    }
  } catch {
    // ignore
  }
  return null;
}

function loadSavedState(): PlannerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved && typeof saved.dailyPaywallViews === 'number') {
      return saved as PlannerState;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveState(state: PlannerState): void {
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

function encodeStateToHash(state: PlannerState): string {
  return '#s=' + btoa(JSON.stringify(state));
}

export function usePlannerState() {
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
