import type { RouteId } from '../model/data'
import { ENCODING } from './encoding'
import { Module, moduleGrid, Mover, Pile, Vessel, type Vec } from './parts'

type Output = 'mixed' | 'blackMass' | 'copper' | 'aluminium' | 'alloy' | 'slag'
type Step = { label: string; fed: boolean; hot: boolean; out: Output[] }

/** What each route does, one step at a time (Blömeke et al. 2022, Section 3.2). */
export const PRETREATMENT: Record<RouteId, Step[]> = {
  pyro: [
    { label: 'Modules in', fed: false, hot: false, out: [] },
    { label: 'Smelted', fed: true, hot: true, out: [] },
    { label: 'Alloy and slag', fed: true, hot: false, out: ['alloy', 'slag'] },
  ],
  mechanical: [
    { label: 'Modules in', fed: false, hot: false, out: [] },
    { label: 'Shredded', fed: true, hot: false, out: ['mixed'] },
    { label: 'Dried', fed: true, hot: true, out: ['mixed'] },
    { label: 'Sieved', fed: true, hot: false, out: ['blackMass', 'copper', 'aluminium'] },
  ],
  thermal: [
    { label: 'Modules in', fed: false, hot: false, out: [] },
    { label: 'Pyrolysed', fed: true, hot: true, out: [] },
    { label: 'Shredded, sieved', fed: true, hot: false, out: ['blackMass', 'copper', 'aluminium'] },
    { label: 'Smelted', fed: true, hot: true, out: ['alloy', 'slag', 'copper', 'aluminium'] },
  ],
}

const AT: Record<Output, Vec> = {
  mixed: [1.1, -0.45, 0.2],
  blackMass: [1.0, -0.45, 0.45],
  copper: [1.05, -0.45, -0.55],
  aluminium: [1.55, -0.45, -0.15],
  alloy: [0.95, -0.35, 0.65],
  slag: [1.55, -0.45, 0.35],
}

function OutputShape({ kind }: { kind: Output }) {
  if (kind === 'alloy')
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.2, 0.25]} />
        <meshStandardMaterial color={ENCODING.steel} metalness={0.6} roughness={0.3} />
      </mesh>
    )
  if (kind === 'mixed')
    return (
      <>
        <Pile color={ENCODING.blackMass} radius={0.45} seed={3} />
        <Pile color={ENCODING.copper} count={60} radius={0.42} seed={4} />
        <Pile color={ENCODING.aluminium} count={60} radius={0.42} seed={5} />
      </>
    )
  const color = { blackMass: ENCODING.blackMass, copper: ENCODING.copper, aluminium: ENCODING.aluminium, slag: ENCODING.slag }[kind]
  return <Pile color={color} radius={kind === 'blackMass' ? 0.38 : 0.26} seed={kind.length} />
}

export function PretreatmentFigure({ route, step }: { route: RouteId; step: number }) {
  const s = PRETREATMENT[route][step]
  return (
    <group scale={0.85}>
      <Vessel hot={s.hot} active size={[0.7, 0.7, 0.7]} />
      {Array.from({ length: 8 }, (_, i) => {
        const [x, y, z] = moduleGrid(i)
        return (
          <Mover key={i} to={s.fed ? [0, 0, 0] : [x * 0.6 - 1.25, y, z * 0.6]} scale={s.fed ? 0 : 0.6}>
            <Module />
          </Mover>
        )
      })}
      {(Object.keys(AT) as Output[]).map((k) => (
        <Mover key={k} to={AT[k]} scale={s.out.includes(k) ? 1 : 0}>
          <OutputShape kind={k} />
        </Mover>
      ))}
    </group>
  )
}
