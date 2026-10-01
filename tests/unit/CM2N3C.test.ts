import { describe, expect, it } from 'vitest'
import type Exercice from '../../src/exercices/Exercice'
import { context } from '../../src/modules/context'

describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('CM2N3C-%s', (n) => {
  it.each([true, false])(
    'génère des questions complètes dont la correction met en évidence la réponse attendue (interactif : %s)',
    async (interactif) => {
      const { default: Classe } = await import(
        `../../src/exercices/CM2/CM2N3C-${n}.ts`
      )
      context.isHtml = true
      for (let graine = 0; graine < 30; graine++) {
        const exercice: Exercice = new Classe()
        exercice.numeroExercice = 0
        exercice.interactif = interactif
        exercice.seed = `graine${graine}`
        exercice.nouvelleVersion()
        expect(exercice.listeQuestions).toHaveLength(exercice.nbQuestions)
        expect(exercice.listeCorrections).toHaveLength(exercice.nbQuestions)
        for (let i = 0; i < exercice.nbQuestions; i++) {
          const attendue = Number(
            String(exercice.autoCorrection[i].valeur?.reponse.value),
          )
          const miseEnEvidence = exercice.listeCorrections[i].match(
            /\\boldsymbol\{([^}]*)\}/,
          )
          expect(miseEnEvidence).not.toBeNull()
          const affichee = Number(
            (miseEnEvidence as RegExpMatchArray)[1]
              .replace(/\\,/g, '')
              .replace(/\{,\}|,/g, '.'),
          )
          expect(affichee).toBe(attendue)
        }
      }
    },
  )
})
