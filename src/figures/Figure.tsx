import { PerspectiveCamera, View } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode, type RefObject } from 'react'
import { MathUtils, type Group } from 'three'

/** Target rotation, and when the reader last turned it (ms). */
type Drag = { target: number; touchedAt: number }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A 3D figure drawn into the page's one shared canvas (see Stage). Horizontal drag or arrow keys rotate it;
 * vertical swipes still scroll the page (touch-action: pan-y).
 */
export function Figure({ label, caption, children }: { label: string; caption: ReactNode; children: ReactNode }) {
  const drag = useRef<Drag>({ target: 0, touchedAt: 0 })
  const lastX = useRef<number | null>(null)
  const turn = (by: number) => {
    drag.current.target += by
    drag.current.touchedAt = performance.now()
  }
  const stop = () => (lastX.current = null)
  return (
    <figure className="fig">
      <div
        className="fig-view"
        role="img"
        aria-label={`${label}. Drag sideways or use the arrow keys to rotate.`}
        tabIndex={0}
        onPointerDown={(e) => (lastX.current = e.clientX)}
        onPointerMove={(e) => {
          if (lastX.current === null) return
          turn((e.clientX - lastX.current) * 0.01)
          lastX.current = e.clientX
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') turn(-0.3)
          if (e.key === 'ArrowRight') turn(0.3)
        }}
      >
        <View className="fig-port">
          <PerspectiveCamera makeDefault position={[0, 1.2, 6]} fov={35} onUpdate={(c) => c.lookAt(0, 0, 0)} />
          <hemisphereLight args={['#ffffff', '#c9d1c4', 1.6]} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} />
          <Spin drag={drag}>{children}</Spin>
        </View>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

function Spin({ drag, children }: { drag: RefObject<Drag>; children: ReactNode }) {
  const group = useRef<Group>(null)
  const idle = useRef(0)
  useFrame((_, dt) => {
    if (!group.current) return
    // A slow idle turn shows it's 3D, paused for 2 s after the reader turns it; reduced motion never idles.
    if (!reducedMotion() && performance.now() - drag.current.touchedAt > 2000) idle.current += dt * 0.15
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, drag.current.target + idle.current, 6, dt)
  })
  return <group ref={group}>{children}</group>
}
