import {
  coeffBaremeExercice,
  pointsMaxQuestion,
} from '../interactif/baremeExercice'
import type { IExercice, QuestionResult, QuestionScore } from '../types'

/** Conserver les points partiels de la question et appliquer le coefficient une seule fois. */
export function scoreQuestionCan(
  exercice: IExercice,
  questionIndex: number,
  result?: QuestionResult,
): QuestionScore {
  const coeff = coeffBaremeExercice(exercice)
  const score =
    typeof result === 'object'
      ? result.score
      : {
          nbBonnesReponses: result
            ? pointsMaxQuestion(exercice, questionIndex)
            : 0,
          nbReponses: pointsMaxQuestion(exercice, questionIndex),
        }
  return {
    nbBonnesReponses: score.nbBonnesReponses * coeff,
    nbReponses: score.nbReponses * coeff,
  }
}

/** Total des points obtenus et possibles, pour l'affichage comme pour le recorder. */
export function totalScoresCan(scores: QuestionScore[]): QuestionScore {
  return scores.reduce(
    (total, score) => ({
      nbBonnesReponses: total.nbBonnesReponses + score.nbBonnesReponses,
      nbReponses: total.nbReponses + score.nbReponses,
    }),
    { nbBonnesReponses: 0, nbReponses: 0 },
  )
}
