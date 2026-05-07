// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { all } from './combinators'
import { sameDescribedSet } from './sameDescribedSet'

describe('sameDescribedSet', () => {
  it('accepts affine expressions describing the same set over Z', () => {
    expect(all([sameDescribedSet()])('2x+2', '2x')).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(all([sameDescribedSet()])('2k\\pi', '2k\\pi-2\\pi')).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(all([sameDescribedSet()])('2k*pi', '2*pi*k-2*pi')).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameDescribedSet({ variable: 'n' })])('4n+1', '4n-3'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
  })

  it('refuses affine expressions describing different sets over Z', () => {
    expect(all([sameDescribedSet()])('2x+1', '2x+2')).toMatchObject({
      isOk: false,
      score: 0,
    })
    expect(all([sameDescribedSet()])('2x', '4x')).toMatchObject({
      isOk: false,
      score: 0,
    })
    expect(all([sameDescribedSet()])('2k\\pi', '2k\\pi+\\pi')).toMatchObject({
      isOk: false,
      score: 0,
    })
  })
})
