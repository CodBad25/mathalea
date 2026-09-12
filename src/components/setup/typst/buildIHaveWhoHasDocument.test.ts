import { describe, expect, it } from 'vitest'
import type { TypstExerciseInput } from './buildTypstDocument'
import {
  buildIHaveWhoHasCards,
  buildIHaveWhoHasDocument,
  duplicateMinimalAnswers,
  harvestIHaveWhoHasCarryOver,
  removeQuestionIndex,
} from './buildIHaveWhoHasDocument'

const exercise: TypstExerciseInput = {
  ref: 'test',
  intro: '',
  questions: ['$12+8$', '$17-5$', '$13\\times2$'],
  introCorrection: '',
  corrections: [
    'Donc $ {\\color{#f15929}\\boldsymbol{20}} $.',
    '$ {\\color{#f15929}\\boldsymbol{12}} $',
    '$ {\\color{#f15929}\\boldsymbol{26}} $',
  ],
  numbered: true,
}

describe('buildIHaveWhoHasDocument', () => {
  it('forme une chaîne fermée réponse courante / question suivante', () => {
    const cards = buildIHaveWhoHasCards([exercise])
    expect(cards.map(({ question }) => question)).toEqual([
      '$17-5$',
      '$13\\times2$',
      '$12+8$',
    ])
    expect(cards[0].answer).toContain('20')
    expect(cards[0].answer).not.toContain('Donc')
  })

  it('imprime réponse et question sur le même côté de chaque carte', () => {
    const code = buildIHaveWhoHasDocument([exercise])
    expect(code).toContain('#strong[J’ai] #reponse')
    expect(code).toContain('#strong[Qui a] #question')
    expect(code).toContain(
      'carte(1, carte-1-reponse, carte-1-question, taille: carte-1-taille)',
    )
    expect(code).toContain('J’ai ..... \\ Qui a .... ?')
    expect(code).toContain('versos (colonnes en miroir)')
  })

  it('détecte une même réponse minimale malgré un balisage différent', () => {
    const withDuplicate: TypstExerciseInput = {
      ...exercise,
      corrections: [
        '$ {\\color{#f15929}\\boldsymbol{19}} $',
        '<span style="color:#f15929;font-weight:bold">19</span>',
        '$ {\\color{#f15929}\\boldsymbol{26}} $',
      ],
    }
    expect(duplicateMinimalAnswers([withDuplicate])).toEqual(['19'])
  })

  it('retire les lettres qui révèlent la position dans la série', () => {
    expect(removeQuestionIndex('$A=-5x(8x-4)$')).toBe('$-5x(8x-4)$')
    expect(removeQuestionIndex('$B = (-6x+9)\\times 5x$')).toBe(
      '$(-6x+9)\\times 5x$',
    )
    expect(removeQuestionIndex('C = $12+8$')).toBe('$12+8$')
    expect(removeQuestionIndex('Calculer $A+3$.')).toBe('Calculer $A+3$.')
  })

  it('conserve le zoom réglé séparément sur chaque carte', () => {
    const first = buildIHaveWhoHasDocument([exercise])
    const edited = first.replace(
      '#let carte-2-taille = 1',
      '#let carte-2-taille = 1.3',
    )
    const carryOver = harvestIHaveWhoHasCarryOver(edited)
    expect(carryOver).toEqual({ cardScales: { 2: 1.3 } })
    expect(
      buildIHaveWhoHasDocument([exercise], undefined, carryOver),
    ).toContain('#let carte-2-taille = 1.3')
  })
})
