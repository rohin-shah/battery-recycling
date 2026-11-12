import { useSyncExternalStore } from 'react'

/**
 * The pH carried from figure 2 to figure 3. Figure 3 starts wherever figure 2 was left (held within its own range),
 * until the reader moves figure 3 itself; moving figure 3 never changes figure 2. Moving figure 2 again hands figure 3
 * back to following it.
 */
let state = { impurity: 1, mixed: null as number | null }
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const update = (next: typeof state) => {
  state = next
  listeners.forEach((fn) => fn())
}

export const setImpurityPH = (pH: number) => update({ impurity: pH, mixed: null })
export const setMixedPH = (pH: number) => update({ ...state, mixed: pH })

export const useImpurityPH = () => useSyncExternalStore(subscribe, () => state.impurity)
export const useMixedPH = () => useSyncExternalStore(subscribe, () => state.mixed ?? state.impurity)
