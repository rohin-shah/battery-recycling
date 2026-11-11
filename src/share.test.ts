import { describe, expect, it } from 'vitest'
import { type Build, DEFAULT_BUILD, fromQuery, toQuery } from './share'

describe('share link', () => {
  it('round-trips a build, including the guess', () => {
    const build: Build = { guess: 'reused', packKwh: 82, route: 'pyro', region: 'china', substitution: 0.75 }
    expect(fromQuery(toQuery(build))).toEqual(build)
  })

  it('leaves the guess out until it is made', () => {
    expect(toQuery(DEFAULT_BUILD)).not.toContain('guess')
    expect(fromQuery(toQuery(DEFAULT_BUILD))).toEqual(DEFAULT_BUILD)
  })

  it('uses defaults for an empty link', () => {
    expect(fromQuery('')).toEqual(DEFAULT_BUILD)
  })

  it('ignores unknown options and junk numbers', () => {
    const b = fromQuery('route=landfill&region=<script>&packKwh=abc&guess=40')
    expect(b).toEqual(DEFAULT_BUILD)
  })

  it('clamps and snaps numbers to the slider ranges', () => {
    const b = fromQuery('packKwh=9999&substitution=0.33')
    expect(b.packKwh).toBe(110)
    expect(b.substitution).toBe(0.35)
  })
})
