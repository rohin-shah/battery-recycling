import type { Material } from '../model/data'
import { ENCODING } from './encoding'
import { Mover, Pile } from './parts'

export const MATERIAL_INK: Record<Material, keyof typeof ENCODING> = {
  nickelSulphate: 'nickel',
  cobaltSulphate: 'cobalt',
  manganeseSulphate: 'manganese',
  lithiumCarbonate: 'lithium',
  graphite: 'graphite',
  aluminium: 'aluminium',
  copper: 'copper',
  steel: 'steel',
}
export const ORDER = Object.keys(MATERIAL_INK) as Material[]

/** One heap per recovered material, its volume proportional to its mass; materials the route loses shrink away. */
export function RecoveredFigure({ kg }: { kg: Partial<Record<Material, number>> }) {
  const max = Math.max(...ORDER.map((m) => kg[m] ?? 0))
  return (
    <group scale={0.7}>
      {ORDER.map((m, i) => {
        const share = (kg[m] ?? 0) / max
        return (
          <Mover key={m} to={[(i % 4) * 0.95 - 1.45, -0.4, Math.floor(i / 4) * 1.1 - 0.55]} scale={Math.cbrt(share)}>
            <Pile color={ENCODING[MATERIAL_INK[m]]} radius={0.45} count={260} seed={i + 11} />
          </Mover>
        )
      })}
    </group>
  )
}
