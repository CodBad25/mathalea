import { describe, expect, it } from 'vitest'
import type { TypstExerciseInput } from './buildTypstDocument'
import {
  buildIHaveWhoHasCards,
  buildIHaveWhoHasDocument,
  duplicateMinimalAnswers,
  harvestIHaveWhoHasCarryOver,
  iHaveWhoHasSeriesId,
  removeQuestionIndex,
  removeTrailingCompletionEquals,
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
      '$17-5$&nbsp;?',
      '$13\\times2$&nbsp;?',
      '$12+8$&nbsp;?',
    ])
    expect(cards[0].answer).toContain('20')
    expect(cards[0].answer).not.toContain('Donc')
    expect(cards[0].answer.endsWith('.')).toBe(true)
  })

  it('ne double pas une ponctuation déjà présente', () => {
    const punctuated = {
      ...exercise,
      questions: ['Question déjà ponctuée ?'],
      corrections: ['Réponse déjà ponctuée.'],
    }
    expect(buildIHaveWhoHasCards([punctuated])).toEqual([
      {
        answer: 'Réponse déjà ponctuée.',
        question: 'Question déjà ponctuée&nbsp;?',
      },
    ])
  })

  it('imprime réponse et question sur le même côté de chaque carte', () => {
    const code = buildIHaveWhoHasDocument([exercise])
    expect(code).toContain('#strong[J’ai] #reponse')
    expect(code).toContain('#strong[Qui a] #question')
    expect(code).toContain(
      'align(left + horizon, text(size: taille-reponses * taille)',
    )
    expect(code).toContain(
      'align(left + horizon, text(size: taille-questions * taille)',
    )
    expect(code).toContain(
      'place(top + right, text(size: 11pt, weight: "bold", code))',
    )
    expect(code).toContain(
      'place(bottom + right, mathalea-anchor("carte-recto", num))',
    )
    expect(code).toContain(
      'carte(1, code-carte-1, carte-1-reponse, carte-1-question, taille: carte-1-taille)',
    )
    expect(code).toContain('image("versoGKiA.jpg"')
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

  it('retire le signe égal final servant de blanc de réponse', () => {
    expect(removeTrailingCompletionEquals('$20\\times 70=$')).toBe(
      '$20\\times 70$',
    )
    expect(removeTrailingCompletionEquals('$x=2$')).toBe('$x=2$')
    expect(buildIHaveWhoHasCards([exercise])[0].question.endsWith('?')).toBe(
      true,
    )
  })

  it('conserve le zoom réglé séparément sur chaque carte', () => {
    const first = buildIHaveWhoHasDocument([exercise])
    const edited = first.replace(
      '#let carte-2-taille = 1',
      '#let carte-2-taille = 1.3',
    )
    const carryOver = harvestIHaveWhoHasCarryOver(edited)
    expect(carryOver.cardScales).toEqual({ 2: 1.3 })
    expect(
      buildIHaveWhoHasDocument([exercise], undefined, carryOver),
    ).toContain('#let carte-2-taille = 1.3')
  })

  it('attribue des codes uniques et ajoute les deux polygones de correction', () => {
    const first = buildIHaveWhoHasDocument(
      [exercise],
      undefined,
      undefined,
      'Ab',
    )
    const codes = [
      ...first.matchAll(/^#let code-carte-\d+ = "([A-Z]\d)"$/gm),
    ].map((match) => match[1])
    expect(codes).toHaveLength(3)
    expect(new Set(codes).size).toBe(3)
    expect(first).toContain('Découper la fenêtre et l’encoche en pointillés')
    expect(first).toContain('Sens de rotation')
    expect(first).not.toContain('Assembler les repères noirs')
    expect(first).toContain('M -75 0 C -75 63 75 63 75 0 Z')
    expect(first).toContain('Polygones de correction et d’assemblage')
    expect(first).toContain('J’ai… Qui a… ?')
    expect(first).not.toContain('sens des aiguilles d’une montre')
    expect(first).toContain('Polygone solution')
    expect(first).toContain('#let titre-serie = "J’ai qui a — Série Ab"')
    expect(first).toContain('text(size: 11pt, weight: "bold", "J’ai qui a")')
    expect(first).toContain('text(size: 11pt, weight: "bold", "Série Ab")')
    expect(first.match(/J’ai qui a — Série Ab/g)).toHaveLength(2)
    expect(first).toContain('rows: (140mm,)')
    expect(first).not.toContain('#grid(width:')
    expect(first).toContain('#set page(paper: "a4", flipped: true')
    // La fenêtre est calculée face à un côté et les deux pièces sont polygonales.
    expect(first).toContain('width=\\"90\\"')
    expect(first).toContain('<polygon points=\\"')
    expect(first).not.toContain('r=\\"280\\"')
    expect(first).toContain('flipped: true')

    const regenerated = buildIHaveWhoHasDocument(
      [exercise],
      undefined,
      harvestIHaveWhoHasCarryOver(first),
    )
    expect(
      [...regenerated.matchAll(/^#let code-carte-\d+ = "([A-Z]\d)"$/gm)].map(
        (match) => match[1],
      ),
    ).toEqual(codes)
  })

  it('calcule un identifiant de série stable à partir des graines', () => {
    const seriesId = iHaveWhoHasSeriesId(['graine-1', 'graine-2'])
    expect(seriesId).toBe(iHaveWhoHasSeriesId(['graine-1', 'graine-2']))
    expect(seriesId).toMatch(/^[A-Z][a-z]$/)
    expect(iHaveWhoHasSeriesId(['graine-1', 'graine-2'])).not.toBe(
      iHaveWhoHasSeriesId(['graine-1', 'graine-3']),
    )
  })
})
