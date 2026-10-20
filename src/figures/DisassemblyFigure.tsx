import { ENCODING } from './encoding'
import { Module, moduleGrid, Mover } from './parts'

/** Step 0: arrives with charge left (modules glow violet). 1: deep-discharged. 2: housing and electronics lifted off and set aside. */
export function DisassemblyFigure({ step }: { step: number }) {
  const opened = step >= 2
  return (
    <group scale={0.8}>
      <Mover to={opened ? [1.6, 0.9, -0.6] : [0, 0, 0]} scale={opened ? 0.7 : 1}>
        <mesh>
          <boxGeometry args={[1.9, 0.4, 1.45]} />
          <meshStandardMaterial color={ENCODING.casing} transparent opacity={0.4} depthWrite={false} />
        </mesh>
        {/* Battery management electronics on the lid */}
        <mesh position={[0.6, 0.23, 0.4]}>
          <boxGeometry args={[0.5, 0.06, 0.35]} />
          <meshStandardMaterial color={ENCODING.copper} roughness={0.5} />
        </mesh>
      </Mover>
      {Array.from({ length: 8 }, (_, i) => (
        <Mover key={i} to={opened ? [moduleGrid(i)[0] * 1.25 - 0.4, -0.15, moduleGrid(i)[2] * 1.25] : moduleGrid(i)}>
          <Module charged={step === 0} />
        </Mover>
      ))}
    </group>
  )
}
