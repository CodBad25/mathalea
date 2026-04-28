import { describe, expect, it } from 'vitest'

import {
  createIdGenerator,
  normalizeAMCNum,
  normalizeAMCOpen,
  renderAMCNum,
  renderElement,
  renderQcm,
} from '../../src/lib/amc/amcEngine'
import type {
  AMCUneProposition,
  AutoCorrectionAMC,
} from '../../src/lib/amc/types'

const exerciceMock = {
  listeQuestions: ['Question 0', 'Question 1', 'Question 2'],
  listeCorrections: ['Correction 0', 'Correction 1', 'Correction 2'],
}

describe('amcEngine', () => {
  it('genere des ids incrementaux avec createIdGenerator', () => {
    const nextId = createIdGenerator('5A10', 0)

    expect(nextId()).toBe('5A10/A-10')
    expect(nextId()).toBe('5A10/A-11')
    expect(nextId()).toBe('5A10/A-12')
  })

  it('normalise une question AMC open', () => {
    const item: AutoCorrectionAMC = {
      enonce: 'Enonce open',
      propositions: [{ texte: 'Ma correction', statut: 2, pointilles: false }],
    }

    const normalized = normalizeAMCOpen(item, {
      ref: 'REF',
      id: 'Q1',
      index: 1,
      exercice: exerciceMock,
    })

    expect(normalized).toEqual({
      type: 'amcopen',
      id: 'REF/Q1',
      ref: 'REF',
      enonce: 'Enonce open',
      correction: 'Ma correction',
      notation: 2,
      sanscadre: false,
      pointilles: false,
    })
  })

  it('normalise AMCNum en mode puissance', () => {
    const item: AutoCorrectionAMC = {
      enonce: 'Ecrire en puissance',
      reponse: {
        valeur: 125,
        param: {
          basePuissance: 5,
          exposantPuissance: 3,
          baseNbChiffres: 1,
          exposantNbChiffres: 1,
        },
      },
    }

    const normalized = normalizeAMCNum(item, {
      ref: 'REF',
      id: 'Q',
      index: 0,
      exercice: exerciceMock,
    })

    expect(normalized.id).toBe('REF/Q0')
    expect(normalized.blocks).toHaveLength(2)
    expect(normalized.blocks[0]).toMatchObject({
      label: 'Base',
      value: 5,
      digits: 1,
      decimals: 0,
      sign: false,
    })
    expect(normalized.blocks[1]).toMatchObject({
      label: 'Exposant',
      value: 3,
      digits: 1,
      decimals: 0,
      sign: true,
    })
  })

  it('normalise AMCNum en mode fraction avec Tpoint specifique', () => {
    const item: AutoCorrectionAMC = {
      reponse: {
        valeur: { num: 3, den: 4 },
        param: {
          digitsNum: 1,
          digitsDen: 1,
        },
      },
    }

    const normalized = normalizeAMCNum(item, {
      ref: 'REF',
      id: 'Q',
      index: 1,
      exercice: exerciceMock,
    })

    expect(normalized.blocks).toHaveLength(1)
    expect(normalized.blocks[0].decimals).toBe(1)
    expect(normalized.blocks[0].options?.Tpoint).toContain('\\vrule')
  })

  it('normalise AMCNum en mode decimal', () => {
    const item: AutoCorrectionAMC = {
      reponse: {
        valeur: 12.5,
        param: {
          digits: 3,
          decimals: 1,
          approx: 0,
          tpoint: ',',
        },
      },
    }

    const normalized = normalizeAMCNum(item, {
      ref: 'REF',
      id: 'Q',
      index: 2,
      exercice: exerciceMock,
    })

    expect(normalized.blocks).toHaveLength(1)
    expect(normalized.blocks[0]).toMatchObject({
      value: 12.5,
      digits: 3,
      decimals: 1,
      sign: false,
    })
    expect(normalized.blocks[0].options?.Tpoint).toBe(',')
  })

  it('rend un QCM mono avec renderQcm', () => {
    const item: AMCUneProposition = {
      enonce: 'Choisir la bonne reponse',
      propositions: [
        { texte: 'A', statut: false },
        { texte: 'B', statut: true },
      ],
      options: {
        vertical: true,
        ordered: false,
      },
    }

    const latex = renderQcm(item, {
      type: 'qcm',
      ref: 'REF',
      id: 'QCM1',
      index: 0,
      exercice: exerciceMock,
    })

    expect(latex).toContain('\\begin{ question }{ QCM1 }')
    expect(latex).toContain('\\bonne{B}')
    expect(latex).toContain('\\mauvaise{A}')
  })

  it('dispatch correctement via renderElement', () => {
    const item: AMCUneProposition = {
      enonce: 'Question dispatch QCM',
      propositions: [
        { texte: 'Vrai', statut: true },
        { texte: 'Faux', statut: false },
      ],
    }

    const latex = renderElement(
      { type: 'qcm', data: item },
      {
        type: 'qcm',
        ref: 'REF',
        id: 'Q',
        index: 0,
        exercice: exerciceMock,
      },
    )

    expect(latex).toContain('Question dispatch QCM')
    expect(latex).toContain('\\bonne{Vrai}')
  })

  it('leve une erreur de template sur renderAMCNum (comportement actuel)', () => {
    const item: AutoCorrectionAMC = {
      enonce: 'Calculer',
      reponse: {
        valeur: 9,
        param: { digits: 1, decimals: 0, tpoint: ',' },
      },
    }

    expect(() =>
      renderAMCNum(item, {
        ref: 'REF',
        id: 'Q',
        index: 0,
        exercice: exerciceMock,
      }),
    ).toThrow(/parseAggregate/)
  })
})
