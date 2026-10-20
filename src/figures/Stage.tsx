import { View } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

/**
 * The page's single WebGL canvas, fixed over the viewport. Each Figure is a View into it, drawn only while on screen;
 * one context avoids the per-page context limit phones impose.
 */
export function Stage() {
  return (
    <Canvas className="stage" dpr={[1, 2]} gl={{ antialias: true, alpha: true }} aria-hidden>
      <View.Port />
    </Canvas>
  )
}
