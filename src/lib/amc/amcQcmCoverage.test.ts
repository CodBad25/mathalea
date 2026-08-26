import seedrandom from 'seedrandom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AntecedentParCalcul from '../../exercices/3e/3F23-1'
import TraduireUnProgrammeDeCalcul from '../../exercices/5e/5N5A-2'
import { context } from '../../modules/context'
import type { IExercice } from '../types'
import { mathaleaEnsureAMCCompatibility } from './amcInference'
import { creerDocumentAmc } from './creerDocumentAmc'

type ExerciseConstructor = new () => IExercice

function prepareLikeAmcPage(
  ExerciseClass: ExerciseConstructor,
  configure?: (exercise: IExercice) => void,
) {
  const exercise = new ExerciseClass()
  exercise.seed = 'amc-qcm-coverage'
  exercise.id = exercise.uuid ?? ExerciseClass.name
  configure?.(exercise)

  exercise.interactif = true
  context.isHtml = true
  context.isAmc = false
  seedrandom(exercise.seed, { global: true })
  exercise.nouvelleVersionWrapper()
  const interactiveAutoCorrection = exercise.autoCorrection.map((item) => ({
    ...item,
    propositions: item.propositions?.map((proposition) => ({ ...proposition })),
  }))

  exercise.interactif = false
  context.isHtml = false
  context.isAmc = true
  seedrandom(exercise.seed, { global: true })
  exercise.nouvelleVersionWrapper()
  ;(exercise as any).interactiveAutoCorrectionForAMC = interactiveAutoCorrection

  mathaleaEnsureAMCCompatibility(exercise)
  return { exercise, interactiveAutoCorrection }
}

afterEach(() => {
  context.isHtml = true
  context.isAmc = false
})

describe('couverture QCM de la page AMC', () => {
  it.each([
    {
      label: 'QCM historique propositionsQcm',
      ExerciseClass: TraduireUnProgrammeDeCalcul,
      configure: undefined,
    },
    {
      label: 'QCM moderne mathalea-qcm',
      ExerciseClass: AntecedentParCalcul,
      configure: (exercise: IExercice) => {
        exercise.sup2 = true
      },
    },
  ])(
    '$label conserve chaque question et chaque proposition',
    ({ ExerciseClass, configure }) => {
      const { exercise, interactiveAutoCorrection } = prepareLikeAmcPage(
        ExerciseClass,
        configure,
      )

      expect(['qcmMono', 'qcmMult']).toContain(exercise.amcType)
      expect(exercise.autoCorrectionAMC).toHaveLength(
        interactiveAutoCorrection.length,
      )

      for (let index = 0; index < interactiveAutoCorrection.length; index++) {
        const source = interactiveAutoCorrection[index]
        const exported = exercise.autoCorrectionAMC?.[index]
        expect(exported?.propositions, `question ${index + 1}`).toHaveLength(
          source.propositions?.length ?? 0,
        )
        expect(
          exported?.propositions?.map((proposition) =>
            Boolean(proposition.statut),
          ),
        ).toEqual(
          source.propositions?.map((proposition) =>
            Boolean(proposition.statut),
          ),
        )
      }

      vi.spyOn(document, 'getElementById').mockReturnValue({
        checked: false,
      } as unknown as HTMLElement)
      const latex = creerDocumentAmc({
        exercices: [exercise],
        assumeAmcPrepared: true,
      })
      const expectedCorrect = interactiveAutoCorrection.reduce(
        (total, item) =>
          total +
          (item.propositions ?? []).filter((proposition) =>
            Boolean(proposition.statut),
          ).length,
        0,
      )
      const expectedIncorrect = interactiveAutoCorrection.reduce(
        (total, item) =>
          total +
          (item.propositions ?? []).filter(
            (proposition) => !Boolean(proposition.statut),
          ).length,
        0,
      )

      expect(latex.match(/\\bonne\{/g) ?? []).toHaveLength(expectedCorrect)
      expect(latex.match(/\\mauvaise\{/g) ?? []).toHaveLength(expectedIncorrect)
    },
  )
})
