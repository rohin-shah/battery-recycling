import { useSyncExternalStore } from 'react'

/**
 * One pH shared by figures 2 and 3, so the second carries on where the first left off: figure 2 covers the impurity
 * step (pH 1 to 5.5) and figure 3 the valuable metals (pH 5.5 to 10.5). Each shows the shared value held within its
 * own part of the scale.
 */
let pH = 1
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setSharedPH(value: number) {
  pH = value
  listeners.forEach((fn) => fn())
}

export const useSharedPH = () => useSyncExternalStore(subscribe, () => pH)
