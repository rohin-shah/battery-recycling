import { PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

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

/** Every figure is seen from the same fixed three-quarter angle: turned 30° and looking slightly down. */
const VIEW_YAW = -Math.PI / 6

/**
 * A 3D figure with its own canvas, created only while it's near the screen so a phone never holds more than a couple of
 * WebGL contexts. The viewpoint is fixed: the reader drives it only through the controls under it.
 */
export function Figure({ label, caption, children }: { label: string; caption: ReactNode; children: ReactNode }) {
  const view = useRef<HTMLDivElement>(null)
  const near = useNearScreen(view)
  return (
    <figure className="fig">
      <div ref={view} className="fig-view" role="img" aria-label={label}>
        {near && (
          <Canvas dpr={[1, 2]} gl={{ antialias: true }} aria-hidden>
            <PerspectiveCamera makeDefault position={[0, 1.2, 6]} fov={35} onUpdate={(c) => c.lookAt(0, 0, 0)} />
            <hemisphereLight args={['#ffffff', '#c9d1c4', 1.6]} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} />
            <group rotation={[0, VIEW_YAW, 0]}>{children}</group>
          </Canvas>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
