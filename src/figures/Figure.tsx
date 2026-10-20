import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { MathUtils, type Group } from 'three'

/** Target rotation, and when the reader last turned it (ms). */
type Drag = { target: number; touchedAt: number }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True while the element is on screen or within 300 px of it. */
function useNearScreen(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px 0px' })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [ref])
  return near
}

/**
 * A 3D figure with its own canvas, created only while it's near the screen so a phone never holds more than a couple of
 * WebGL contexts. The canvas scrolls with the page like any element. Horizontal drag or arrow keys rotate it; vertical
 * swipes still scroll the page (touch-action: pan-y).
 */
export function Figure({ label, caption, children }: { label: string; caption: ReactNode; children: ReactNode }) {
  const view = useRef<HTMLDivElement>(null)
  const near = useNearScreen(view)
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
        ref={view}
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
        {near && (
          <Canvas dpr={[1, 2]} gl={{ antialias: true }} style={{ touchAction: 'pan-y' }} aria-hidden>
            <PerspectiveCamera makeDefault position={[0, 1.2, 6]} fov={35} onUpdate={(c) => c.lookAt(0, 0, 0)} />
            <hemisphereLight args={['#ffffff', '#c9d1c4', 1.6]} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} />
            <Spin drag={drag}>{children}</Spin>
          </Canvas>
        )}
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
