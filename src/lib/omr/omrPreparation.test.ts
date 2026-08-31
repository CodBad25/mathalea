import { describe, expect, it, vi } from 'vitest'
import { context } from '../../modules/context'
import { preparerExercice, preparerExercices } from './omrPreparation'
import type { IExercice } from '../types'

/** Exercice minimal, dont la génération se contente de remplir une liste. */
function exerciceFactice(overrides: Record<string, unknown> = {}) {
  const exercice = {
    id: 'X1',
    seed: 'abcd',
    interactif: false,
    listeQuestions: [] as string[],
    autoCorrection: [] as unknown[],
    lastCallback: 'déjà généré',
    nouvelleVersionWrapper: vi.fn(function (this: Record<string, unknown>) {
      ;(this.listeQuestions as string[]).push('Q1')
      ;(this.autoCorrection as unknown[]).push({
        propositions: [{ texte: 'a', statut: true }],
      })
    }),
    ...overrides,
  }
  return exercice as unknown as IExercice
}

describe('preparerExercice', () => {
  it('génère l’exercice, qui n’est que chargé sans cela', () => {
    const exercice = exerciceFactice()
    preparerExercice(exercice)
    expect(exercice.listeQuestions).toHaveLength(1)
    expect(exercice.autoCorrection).toHaveLength(1)
  })

  it('vide la mémoïsation, sans quoi la génération serait ignorée', () => {
    // `lastCallback` fait sauter la régénération quand la signature n'a pas
    // changé : l'exercice resterait vide et aucune case ne serait imprimée
    const exercice = exerciceFactice()
    preparerExercice(exercice)
    expect(
      (
        exercice as unknown as {
          nouvelleVersionWrapper: ReturnType<typeof vi.fn>
        }
      ).nouvelleVersionWrapper,
    ).toHaveBeenCalled()
  })

  it('génère en contexte interactif, seul cas où autoCorrection est rempli', () => {
    let interactifPendant: boolean | undefined
    let isHtmlPendant: boolean | undefined
    let isAmcPendant: boolean | undefined
    const exercice = exerciceFactice({
      nouvelleVersionWrapper: vi.fn(function (this: { interactif: boolean }) {
        interactifPendant = this.interactif
        isHtmlPendant = context.isHtml
        isAmcPendant = context.isAmc
      }),
    })
    preparerExercice(exercice)
    expect(interactifPendant).toBe(true)
    expect(isHtmlPendant).toBe(true)
    expect(isAmcPendant).toBe(false)
  })

  it('restaure le contexte global qu’il a modifié', () => {
    const isHtmlAvant = context.isHtml
    const isAmcAvant = context.isAmc
    context.isHtml = false
    context.isAmc = true
    const exercice = exerciceFactice({ interactif: false })
    preparerExercice(exercice)
    expect(context.isHtml).toBe(false)
    expect(context.isAmc).toBe(true)
    expect(exercice.interactif).toBe(false)
    context.isHtml = isHtmlAvant
    context.isAmc = isAmcAvant
  })

  it('restaure le contexte même si la génération échoue', () => {
    // un exercice qui lève laisserait sinon tout MathALÉA en contexte AMC
    const isHtmlAvant = context.isHtml
    const exercice = exerciceFactice({
      nouvelleVersionWrapper: vi.fn(() => {
        throw new Error('exercice cassé')
      }),
    })
    expect(() => preparerExercice(exercice)).toThrow('exercice cassé')
    expect(context.isHtml).toBe(isHtmlAvant)
    expect(exercice.interactif).toBe(false)
  })

  it('ignore un exercice sans générateur plutôt que de lever', () => {
    const exercice = exerciceFactice({ nouvelleVersionWrapper: undefined })
    expect(() => preparerExercice(exercice)).not.toThrow()
  })

  it('génère chaque exercice de la liste', () => {
    const exercices = [exerciceFactice(), exerciceFactice()]
    preparerExercices(exercices)
    for (const exercice of exercices) {
      expect(exercice.listeQuestions).toHaveLength(1)
    }
  })

  it('génère avec la graine imposée, puis restaure celle de l’exercice', () => {
    let grainePendant: unknown
    const exercice = exerciceFactice({
      seed: 'graine-native',
      nouvelleVersionWrapper: vi.fn(function (this: { seed: unknown }) {
        grainePendant = this.seed
      }),
    })
    preparerExercice(exercice, 'graine-eleve-03')
    expect(grainePendant).toBe('graine-eleve-03')
    // l'exercice ne doit pas garder trace de ce détournement
    expect(exercice.seed).toBe('graine-native')
  })

  it('restaure la graine même si la génération échoue', () => {
    const exercice = exerciceFactice({
      seed: 'graine-native',
      nouvelleVersionWrapper: vi.fn(() => {
        throw new Error('exercice cassé')
      }),
    })
    expect(() => preparerExercice(exercice, 'graine-eleve-03')).toThrow()
    expect(exercice.seed).toBe('graine-native')
  })

  it('propage la graine imposée à toute la liste', () => {
    const graines: unknown[] = []
    const faire = () =>
      exerciceFactice({
        nouvelleVersionWrapper: vi.fn(function (this: { seed: unknown }) {
          graines.push(this.seed)
        }),
      })
    preparerExercices([faire(), faire()], 'commune')
    expect(graines).toEqual(['commune', 'commune'])
  })
})
