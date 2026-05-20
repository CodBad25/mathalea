// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { all } from './combinators'
import { sameIntegerProgressionSet } from './sameIntegerProgressionSet'

describe('sameIntegerProgressionSet', () => {
  it('accepts affine expressions describing the same set over Z', () => {
    expect(all([sameIntegerProgressionSet()])('2x+2', '2x')).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])('2k\\pi', '2k\\pi-2\\pi'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])('2k*pi', '2*pi*k-2*pi'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])('-1/2pi+kpi', '1/2pi+kpi'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])('-1/2 pi + k pi', '1/2 pi + k pi'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])('-1/2*pi+k*pi', '1/2*pi+k*pi'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])(
        '-\\frac{1}{2}\\pi+k\\pi',
        '\\frac{1}{2}\\pi+k\\pi',
      ),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])(
        '-\\frac12\\pi+k\\pi',
        '\\frac12\\pi+k\\pi',
      ),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet()])(
        '\\frac{-1}{2}\\pi+k\\pi',
        '\\frac{1}{2}\\pi+k\\pi',
      ),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
    expect(
      all([sameIntegerProgressionSet({ variable: 'n' })])('4n+1', '4n-3'),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
  })

  it('refuses affine expressions describing different sets over Z', () => {
    expect(all([sameIntegerProgressionSet()])('2x+1', '2x+2')).toMatchObject({
      isOk: false,
      score: 0,
    })
    expect(all([sameIntegerProgressionSet()])('2x', '4x')).toMatchObject({
      isOk: false,
      score: 0,
    })
    expect(
      all([sameIntegerProgressionSet()])('2k\\pi', '2k\\pi+\\pi'),
    ).toMatchObject({
      isOk: false,
      score: 0,
    })
  })

  it('accepts the equivalent zero-set answer with semicolon or comma branches', () => {
    const compare = all([
      sameIntegerProgressionSet({
        variable: 'k',
        allowMultipleExpressions: true,
      }),
    ])

    expect(
      compare(
        'S=\\left\\{\\frac{4\\pi}{3}+4k\\pi;-\\frac{2\\pi}{3}+4k\\pi\\mid k\\in\\mathbb{Z}\\right\\}',
        '-\\frac{2\\pi}{3}+2k\\pi',
      ),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })

    expect(
      compare(
        'S=\\left\\{\\frac{4\\pi}{3}+4k\\pi,-\\frac{2\\pi}{3}+4k\\pi\\mid k\\in\\mathbb{Z}\\right\\}',
        '-\\frac{2\\pi}{3}+2k\\pi',
      ),
    ).toMatchObject({
      isOk: true,
      score: 1,
    })
  })

  it('refuses an incomplete union of progressions', () => {
    expect(
      all([
        sameIntegerProgressionSet({
          variable: 'k',
          allowMultipleExpressions: true,
        }),
      ])('\\frac{4\\pi}{3}+4k\\pi', '-\\frac{2\\pi}{3}+2k\\pi'),
    ).toMatchObject({
      isOk: false,
      score: 0,
    })
  })
})
