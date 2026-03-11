// src/hooks/useOnboardingTour.js
import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'modelpricer:onboarding:calculator';

/**
 * Hook for managing the onboarding tour state.
 *
 * Persists "completed" flag in localStorage so the tour only auto-starts
 * on the very first visit. Provides controls to navigate between steps,
 * skip, and restart the tour.
 */
export function useOnboardingTour(steps) {
  const totalSteps = steps?.length ?? 0;

  // Read persisted flag once on mount.
  const [completed, setCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'done';
    } catch {
      return false;
    }
  });

  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // "Do not show again" checkbox value — persisted when tour finishes.
  const [doNotShowAgain, setDoNotShowAgain] = useState(true);

  // Track whether auto-start has already fired this mount.
  const autoStartedRef = useRef(false);

  // Auto-start on first visit (not completed).
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!completed && totalSteps > 0) {
      autoStartedRef.current = true;
      // Small delay so the page has time to render target elements.
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [completed, totalSteps]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= totalSteps - 1) return prev;
      return prev + 1;
    });
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const finishTour = useCallback(() => {
    setActive(false);
    if (doNotShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'done');
      } catch { /* noop */ }
      setCompleted(true);
    }
  }, [doNotShowAgain]);

  const skipTour = useCallback(() => {
    finishTour();
  }, [finishTour]);

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
    setCompleted(false);
    setCurrentStepIndex(0);
    setDoNotShowAgain(true);
  }, []);

  return {
    active,
    currentStepIndex,
    currentStep: steps?.[currentStepIndex] ?? null,
    totalSteps,
    completed,
    doNotShowAgain,
    setDoNotShowAgain,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    resetTour,
  };
}
