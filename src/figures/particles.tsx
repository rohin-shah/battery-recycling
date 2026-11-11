import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Object3D, type InstancedMesh } from 'three'
import type { Vec } from './parts'

/**
 * Conserved material: every piece exists from the first frame and only moves. The scrubber is time: a piece's position
 * is a pure function of progress, so dragging back plays it backwards exactly.
 */

/** A place pieces can rest: a box (centre, half-size), a conical pile (centre on the floor, [radius, height]) or a pallet of modules. */
export type Region = { kind: 'box'; c: Vec; s: Vec } | { kind: 'pile'; c: Vec; r: number; h: number } | { kind: 'modules'; c: Vec }
/** Where a stream ends each step, optionally passing through one or more machines on the way. */
export type Leg = Region | { via: Region[]; to: Region }
/**
 * A kind of material: its colour once revealed, how many pieces, and where it is at the end of each step (legs[0] =
 * start). `recolor` changes its colour during a later step, e.g. black mass becoming alloy in a furnace.
 */
export type Stream = { color: string; count: number; legs: Leg[]; startColor?: string; size?: number; recolor?: { step: number; color: string } }

export const box = (c: Vec, s: Vec): Region => ({ kind: 'box', c, s })
export const pile = (c: Vec, r: number, h = r * 0.7): Region => ({ kind: 'pile', c, r, h })

/** The 32 modules from chapter 2, laid out 8 × 4 on a pallet; each module is 35 × 15 × 11 cm. */
const MODULE: Vec = [0.35, 0.11, 0.15]
const PALLET = { cols: 8, rows: 4, dx: 0.38, dz: 0.18 }

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function place(r: Region, i: number): Vec {
  const [u0, u1, u2] = [hash(i, 1), hash(i, 2), hash(i, 3)]
  if (r.kind === 'box') return [r.c[0] + (u0 * 2 - 1) * r.s[0], r.c[1] + (u1 * 2 - 1) * r.s[1], r.c[2] + (u2 * 2 - 1) * r.s[2]]
  if (r.kind === 'pile') {
    const rr = Math.sqrt(u0) * r.r
    const a = u1 * Math.PI * 2
    return [r.c[0] + Math.cos(a) * rr, r.c[1] + u2 * r.h * (1 - rr / r.r), r.c[2] + Math.sin(a) * rr]
  }
  // Pieces fill the modules, so the pallet reads as 32 solid blocks until shredding.
  const m = i % (PALLET.cols * PALLET.rows)
  const mx = (m % PALLET.cols) - (PALLET.cols - 1) / 2
  const mz = Math.floor(m / PALLET.cols) - (PALLET.rows - 1) / 2
  return [r.c[0] + mx * PALLET.dx + (u0 - 0.5) * MODULE[0] * 0.8, r.c[1] + 0.05 + u1 * MODULE[1] * 0.6, r.c[2] + mz * PALLET.dz + (u2 - 0.5) * MODULE[2] * 0.7]
}

const end = (l: Leg) => ('via' in l ? l.to : l)

/** Where piece `i` of a stream is at scrubber position `p`. */
export function positionAt(s: Stream, i: number, p: number): Vec {
  if (p <= 0) return place(end(s.legs[0]), i)
  const k = Math.min(s.legs.length - 1, Math.ceil(p))
  if (p > s.legs.length - 1) return place(end(s.legs[k]), i)
  const t = p - (k - 1)
  // Pieces set off one after another over the first 40% of the step and each takes 60% of it.
  const u = MathUtils.smootherstep(MathUtils.clamp((t - hash(i, 4) * 0.4) / 0.6, 0, 1), 0, 1)
  const a = place(end(s.legs[k - 1]), i)
  const leg = s.legs[k]
  const b = place(end(leg), i)
  if (!('via' in leg)) return arc(a, b, u)
  // Equal time on each hop: start → each machine in turn → destination.
  const stops = [a, ...leg.via.map((v) => place(v, i)), b]
  const hops = stops.length - 1
  const h = Math.min(hops - 1, Math.floor(u * hops))
  return arc(stops[h], stops[h + 1], u * hops - h)
}

function arc(a: Vec, b: Vec, u: number): Vec {
  if (u <= 0) return a
  if (u >= 1) return b
  const lift = Math.sin(u * Math.PI) * (0.3 + Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.12)
  return [MathUtils.lerp(a[0], b[0], u), MathUtils.lerp(a[1], b[1], u) + lift, MathUtils.lerp(a[2], b[2], u)]
}

/** How far a stream's colour has been revealed: pieces show module colour until the first step that moves them. */
export const revealAt = (s: Stream, p: number) => {
  const first = s.legs.findIndex((l, k) => k > 0 && end(l) !== end(s.legs[k - 1]))
  return first < 0 ? 1 : MathUtils.clamp(p - (first - 1), 0, 1)
}

const MODULE_COLOUR = '#8f9a63'

export function Particles({ streams, progress }: { streams: Stream[]; progress: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const total = streams.reduce((n, s) => n + s.count, 0)
  const [o, c, from, to] = useMemo(() => [new Object3D(), new Color(), new Color(), new Color()], [])
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    let n = 0
    for (const s of streams) {
      from.set(s.startColor ?? MODULE_COLOUR)
      to.set(s.color)
      c.copy(from).lerp(to, revealAt(s, progress))
      if (s.recolor) c.lerp(to.set(s.recolor.color), MathUtils.clamp(progress - (s.recolor.step - 1), 0, 1))
      for (let i = 0; i < s.count; i++, n++) {
        o.position.set(...positionAt(s, n, progress))
        o.rotation.set(hash(n, 5) * 6, hash(n, 6) * 6, 0)
        o.scale.setScalar((s.size ?? 0.1) * (0.7 + hash(n, 7) * 0.6))
        o.updateMatrix()
        m.setMatrixAt(n, o.matrix)
        m.setColorAt(n, c)
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [streams, progress, o, c, from, to])
  return (
    <instancedMesh key={total} ref={mesh} args={[undefined, undefined, total]} frustumCulled={false}>
      <boxGeometry args={[1, 0.7, 1]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  )
}
