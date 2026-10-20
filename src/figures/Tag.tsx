import { Html } from '@react-three/drei'
import type { Vec } from './parts'

/**
 * A label pinned to a point in the scene, with a short leader line down to it. It's HTML laid over the canvas, so it
 * stays sharp at any size and needs no font download. Decorative: the figure's caption carries the same information.
 * Hide with `show` rather than unmounting: unmounting an HTML label mid-render makes React warn about racing roots.
 */
export function Tag({ at, show = true, children }: { at: Vec; show?: boolean; children: string }) {
  return (
    <Html position={at} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <span className="tag" aria-hidden style={show ? undefined : { display: 'none' }}>
        {children}
      </span>
    </Html>
  )
}
