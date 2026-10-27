import { useCallback, useReducer } from "react"

export type History<T> = {
  past: T[]
  present: T
  future: T[]
  /** Tag and time of the last change, so a burst of typing becomes one undo step. */
  last?: { tag: string; at: number }
}

export type SetOptions = { coalesce?: string }

export type HistoryAction<T> =
  | { type: "set"; value: T; coalesce?: string; at: number }
  | { type: "undo" }
  | { type: "redo" }

export const HISTORY_LIMIT = 100
export const COALESCE_MS = 600

export function historyReducer<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  switch (action.type) {
    case "set": {
      if (Object.is(action.value, state.present)) return state
      const merge =
        action.coalesce !== undefined &&
        state.last?.tag === action.coalesce &&
        action.at - state.last.at < COALESCE_MS &&
        state.past.length > 0
      const last = action.coalesce !== undefined ? { tag: action.coalesce, at: action.at } : undefined
      // Merging keeps the snapshot from before the burst started and just moves `present` forward.
      if (merge) return { past: state.past, present: action.value, future: [], last }
      return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: action.value, future: [], last }
    }
    case "undo": {
      if (state.past.length === 0) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      }
    }
    case "redo": {
      if (state.future.length === 0) return state
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) }
    }
  }
}

export function useHistory<T>(initial: T | (() => T)) {
  const [state, dispatch] = useReducer(historyReducer<T>, undefined, () => ({
    past: [],
    present: typeof initial === "function" ? (initial as () => T)() : initial,
    future: [],
  }))
  const set = useCallback((value: T, opts?: SetOptions) => {
    dispatch({ type: "set", value, coalesce: opts?.coalesce, at: Date.now() })
  }, [])
  const undo = useCallback(() => dispatch({ type: "undo" }), [])
  const redo = useCallback(() => dispatch({ type: "redo" }), [])
  return {
    value: state.present,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
