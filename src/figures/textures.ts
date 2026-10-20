import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Textures drawn in code, so there's nothing to license or download. Each is made once and shared.
 */

const cache = new Map<string, CanvasTexture>()

function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...repeat)
  }
  cache.set(key, t)
  return t
}

/** Deterministic noise so textures look the same every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
}

/** Brushed steel: fine horizontal streaks. */
export const brushedSteel = () =>
  make('steel', 256, (g, s) => {
    const r = rng(3)
    g.fillStyle = '#9aa0a6'
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 900; i++) {
      const y = r() * s
      g.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '40,45,50'},${0.05 + r() * 0.08})`
      g.beginPath()
      g.moveTo(r() * s, y)
      g.lineTo(r() * s, y)
      g.stroke()
    }
  })

/** Painted machine panel: green-grey with seams and rivets, and a yellow/black hazard band along the bottom. */
export const machinePanel = () =>
  make('panel', 512, (g, s) => {
    const r = rng(7)
    g.fillStyle = '#7d8a7f'
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.05})`
      g.fillRect(r() * s, r() * s, 2, 2)
    }
    g.strokeStyle = 'rgba(30,35,30,0.45)'
    g.lineWidth = 3
    for (const x of [s / 3, (2 * s) / 3]) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, s * 0.88)
      g.stroke()
    }
    g.fillStyle = 'rgba(40,45,40,0.6)'
    for (let x = 12; x < s; x += 40) for (const y of [12, s * 0.86]) g.fillRect(x, y, 5, 5)
    // Hazard band
    const top = s * 0.9
    g.fillStyle = '#e8b923'
    g.fillRect(0, top, s, s - top)
    g.fillStyle = '#1d1d1b'
    for (let x = -s; x < s; x += 40) {
      g.beginPath()
      g.moveTo(x, s)
      g.lineTo(x + 20, s)
      g.lineTo(x + 20 + (s - top), top)
      g.lineTo(x + (s - top), top)
      g.fill()
    }
  })

/** Battery module housing: dark sage casing with a white label. */
export const moduleLabel = () =>
  make('module', 256, (g, s) => {
    g.fillStyle = '#8f9a63'
    g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(0,0,0,0.25)'
    g.lineWidth = 6
    g.strokeRect(8, 8, s - 16, s - 16)
    g.fillStyle = '#f4f4ef'
    g.fillRect(s * 0.18, s * 0.32, s * 0.64, s * 0.36)
    g.fillStyle = '#1b2620'
    g.font = `bold ${s * 0.1}px system-ui, sans-serif`
    g.textAlign = 'center'
    g.fillText('NMC MODULE', s / 2, s * 0.47)
    g.font = `${s * 0.07}px system-ui, sans-serif`
    g.fillText('Li-ion · HIGH VOLTAGE', s / 2, s * 0.6)
  })

/** Pouch-cell foil: crinkled silver laminate. */
export const pouchFoil = () =>
  make('pouch', 256, (g, s) => {
    const r = rng(11)
    const grad = g.createLinearGradient(0, 0, s, s)
    grad.addColorStop(0, '#d9dcd8')
    grad.addColorStop(1, '#b7bbb7')
    g.fillStyle = grad
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 120; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.15 + r() * 0.2})`
      g.beginPath()
      const x = r() * s
      const y = r() * s
      g.moveTo(x, y)
      g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60)
      g.stroke()
    }
  })

/** Concrete floor with a 1 m grid: one texture repeat = 1 m, so the grid doubles as a scale. */
export const concreteGrid = () =>
  make(
    'floor',
    256,
    (g, s) => {
      const r = rng(5)
      g.fillStyle = '#d9dad4'
      g.fillRect(0, 0, s, s)
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = `rgba(0,0,0,${r() * 0.05})`
        g.fillRect(r() * s, r() * s, 2, 2)
      }
      g.strokeStyle = 'rgba(60,65,60,0.35)'
      g.lineWidth = 3
      g.strokeRect(0, 0, s, s)
    },
    [1, 1],
  )
