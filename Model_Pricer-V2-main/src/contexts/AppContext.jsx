import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { readTenantJson, writeTenantJson } from '@/utils/adminTenantStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { debug } from '@/lib/debug';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREFERENCES_NAMESPACE = 'preferences:v1';

const APP_VERSION = __APP_VERSION__ ?? '0.0.0';

// Default app-level feature flags (not storage-mode flags — those stay in featureFlags.js)
const DEFAULT_FEATURE_FLAGS = {
  betaFeatures: false,
  newPricingUI: false,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ActionTypes = {
  SET_FEATURE_FLAGS: 'SET_FEATURE_FLAGS',
  SET_FEATURE_FLAG: 'SET_FEATURE_FLAG',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  HYDRATE: 'HYDRATE',
};

function getInitialState() {
  return {
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    globalLoading: false,
    hydrated: false,
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.HYDRATE:
      return {
        ...state,
        featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...action.payload.featureFlags },
        hydrated: true,
      };

    case ActionTypes.SET_FEATURE_FLAGS:
      return {
        ...state,
        featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...action.payload },
      };

    case ActionTypes.SET_FEATURE_FLAG:
      return {
        ...state,
        featureFlags: {
          ...state.featureFlags,
          [action.payload.flag]: action.payload.value,
        },
      };

    case ActionTypes.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.payload,
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
  const isOnline = useOnlineStatus();

  // -- Hydrate from tenant-scoped localStorage on mount ----------------------
  useEffect(() => {
    try {
      const saved = readTenantJson(PREFERENCES_NAMESPACE, null);
      if (saved && typeof saved === 'object') {
        dispatch({
          type: ActionTypes.HYDRATE,
          payload: {
            featureFlags: saved.featureFlags ?? {},
          },
        });
        debug('[AppContext] Hydrated from tenant storage');
      } else {
        dispatch({
          type: ActionTypes.HYDRATE,
          payload: { featureFlags: {} },
        });
        debug('[AppContext] No saved preferences, using defaults');
      }
    } catch {
      dispatch({
        type: ActionTypes.HYDRATE,
        payload: { featureFlags: {} },
      });
    }
  }, []);

  // -- Persist feature flags whenever they change (after hydration) ----------
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      writeTenantJson(PREFERENCES_NAMESPACE, {
        featureFlags: state.featureFlags,
      });
    } catch {
      // silently fail — storage might be full or unavailable
    }
  }, [state.featureFlags, state.hydrated]);

  // -- Dispatch helpers (stable refs via useCallback) ------------------------

  const setFeatureFlags = useCallback((flags) => {
    dispatch({ type: ActionTypes.SET_FEATURE_FLAGS, payload: flags });
  }, []);

  const setFeatureFlag = useCallback((flag, value) => {
    dispatch({
      type: ActionTypes.SET_FEATURE_FLAG,
      payload: { flag, value },
    });
  }, []);

  const setGlobalLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_GLOBAL_LOADING, payload: Boolean(loading) });
  }, []);

  // -- Context value (memoized to prevent unnecessary re-renders) -----------

  const value = useMemo(
    () => ({
      // State
      featureFlags: state.featureFlags,
      globalLoading: state.globalLoading,
      isOnline,
      appVersion: APP_VERSION,
      hydrated: state.hydrated,

      // Dispatch helpers
      setFeatureFlags,
      setFeatureFlag,
      setGlobalLoading,
    }),
    [
      state.featureFlags,
      state.globalLoading,
      state.hydrated,
      isOnline,
      setFeatureFlags,
      setFeatureFlag,
      setGlobalLoading,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Full AppContext access.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within <AppProvider>');
  }
  return ctx;
}

/**
 * Check a single app-level feature flag.
 * Returns false for unknown flags.
 *
 * @param {string} flagName
 * @returns {boolean}
 */
export function useFeatureFlag(flagName) {
  const { featureFlags } = useApp();
  return Boolean(featureFlags[flagName]);
}

export default AppContext;
