import { describe, expect, it } from 'vitest'
import { keys } from './keycaps'
import {
  enregistreTouchesPersonnalisees,
  litTouchesPersonnalisees,
  toucheDepuisCle,
} from './touchesPersonnalisees'

describe('touches personnalisées', () => {
  it('reconnaît les raccourcis nommés', () => {
    expect(toucheDepuisCle('POW')).toEqual({
      display: '$\\square^\\square$',
      insert: '#@^{#0}',
    })
    expect(toucheDepuisCle('SQRT').insert).toBe('\\sqrt{#1}')
  })

  it('affiche le LaTeX des touches libres et l’insère tel quel', () => {
    expect(toucheDepuisCle('a')).toEqual({ display: '$a$', insert: 'a' })
    expect(toucheDepuisCle('\\pi')).toEqual({
      display: '$\\pi$',
      insert: '\\pi',
    })
  })

  it('remplace les emplacements MathLive par un carré à l’affichage', () => {
    expect(toucheDepuisCle('f(#0)')).toEqual({
      display: '$f(\\square)$',
      insert: 'f(#0)',
    })
    expect(toucheDepuisCle('\\lim_{#0\\to #1}').display).toBe(
      '$\\lim_{\\square\\to \\square}$',
    )
  })

  it('enregistre les touches dans la table du clavier, sans doublon', () => {
    const noms = enregistreTouchesPersonnalisees(['u_n', 'u_n', '', 'POW'])
    expect(noms).toHaveLength(2)
    const table = keys as Record<string, { display: string; insert?: string }>
    expect(table[noms[0]]).toEqual({ display: '$u_n$', insert: 'u_n' })
    expect(table[noms[1]].insert).toBe('#@^{#0}')
  })

  it('relit la liste stockée sur le champ, même mal formée', () => {
    expect(litTouchesPersonnalisees('["a","b"]')).toEqual(['a', 'b'])
    expect(litTouchesPersonnalisees(undefined)).toEqual([])
    expect(litTouchesPersonnalisees('pas du json')).toEqual([])
    expect(litTouchesPersonnalisees('{"a":1}')).toEqual([])
  })
})
