import { useState, useRef, useCallback } from 'react';

/**
 * useUndoRedo -- generic undo/redo state management hook.
 *
 * Maintains a linear history of state snapshots stored in refs (past/future
 * stacks) so that pushing a new state does not trigger extra renders from the
 * history arrays themselves. Only the current state value is held in React
 * state, keeping re-renders minimal.
 *
 * @param {object} initialState  The starting state object.
 * @param {number} [maxHistory=50]  Maximum number of undo steps retained.
 *   When exceeded the oldest entry is removed (FIFO).
 *
 * @returns {{
 *   state: object,
 *   setState: (newState: object) => void,
 *   undo: () => void,
 *   redo: () => void,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   reset: (state: object) => void,
 *   isDirty: boolean,
 *   historyLength: number,
 * }}
 */
export default function useUndoRedo(initialState, maxHistory = 50) {
  // ---------------------------------------------------------------------------
  // Core state -- only this triggers renders.
  // ---------------------------------------------------------------------------
  const [current, setCurrent] = useState(initialState);

  // ---------------------------------------------------------------------------
  // Refs for stacks and the "original" snapshot used by isDirty.
  // Using refs avoids unnecessary re-renders when the stacks change, because
  // consumers only care about canUndo/canRedo which we derive lazily.
  // ---------------------------------------------------------------------------
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const originalRef = useRef(initialState);

  // We keep a render-tick counter so that canUndo / canRedo recalculate after
  // every push/pop. This is cheaper than putting the full stacks into state.
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  // ---------------------------------------------------------------------------
  // setState -- push the current value onto the past stack, set new current,
  // and clear the future stack (branching erases redo history).
  // ---------------------------------------------------------------------------
  const setState = useCallback(
    (newState) => {
      setCurrent((prev) => {
        // Push previous value onto the past stack.
        const nextPast = [...pastRef.current, prev];
        // Enforce max history (FIFO -- drop oldest).
        if (nextPast.length > maxHistory) {
          nextPast.splice(0, nextPast.length - maxHistory);
        }
        pastRef.current = nextPast;
        // Branching: any new edit clears the redo (future) stack.
        futureRef.current = [];
        return newState;
      });
      bump();
    },
    [maxHistory, bump],
  );

  // ---------------------------------------------------------------------------
  // undo -- pop from past, push current onto future.
  // ---------------------------------------------------------------------------
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    setCurrent((prev) => {
      const past = [...pastRef.current];
      const previous = past.pop();
      pastRef.current = past;
      futureRef.current = [prev, ...futureRef.current];
      return previous;
    });
    bump();
  }, [bump]);

  // ---------------------------------------------------------------------------
  // redo -- pop from future, push current onto past.
  // ---------------------------------------------------------------------------
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    setCurrent((prev) => {
      const future = [...futureRef.current];
      const next = future.shift();
      futureRef.current = future;
      pastRef.current = [...pastRef.current, prev];
      return next;
    });
    bump();
  }, [bump]);

  // ---------------------------------------------------------------------------
  // setWithoutHistory -- update current state without pushing to undo stack.
  // Useful for live preview during slider drags (debounced commit follows).
  // ---------------------------------------------------------------------------
  const setWithoutHistory = useCallback((newState) => {
    setCurrent(typeof newState === 'function' ? newState : () => newState);
  }, []);

  // ---------------------------------------------------------------------------
  // reset -- set current to the given state, clear both stacks, and update
  // the original reference (so isDirty becomes false).
  // ---------------------------------------------------------------------------
  const reset = useCallback(
    (state) => {
      pastRef.current = [];
      futureRef.current = [];
      originalRef.current = state;
      setCurrent(state);
      bump();
    },
    [bump],
  );

  // ---------------------------------------------------------------------------
  // Derived values.
  // ---------------------------------------------------------------------------
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;
  const historyLength = pastRef.current.length;

  // isDirty: true when the current state differs from the original snapshot
  // that was provided at initialisation (or the last reset()).
  const isDirty = JSON.stringify(current) !== JSON.stringify(originalRef.current);

  return {
    state: current,
    setState,
    setWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    isDirty,
    historyLength,
  };
}
