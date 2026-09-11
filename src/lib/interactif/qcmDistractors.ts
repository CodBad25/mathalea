import type ExerciceSimple from '../../exercices/ExerciceSimple'
import FractionEtendue from '../../modules/FractionEtendue'
import { shuffle } from '../outils/arrayOutils'
import { isAnswerValueType, type AnswerValueType, type Valeur } from '../types'

export function getDistracteurs(
  exerciceSimple: ExerciceSimple,
): (string | number)[] {
  const distracteursUniques = [...new Set(exerciceSimple.distracteurs)]
  const distracteursNonSolutions = distracteursUniques.filter((distracteur) => {
    const reponse: AnswerValueType | Valeur | undefined = exerciceSimple.reponse
    if (reponse == null) {
      return true // Si pas de réponse, on garde tous les distracteurs
    }
    let value: AnswerValueType | undefined
    if (isAnswerValueType(reponse)) {
      value = reponse
    } else {
      // Si reponse n'est pas un AnswerValueType, alors c'est un Valeur dont on va récupérer le AnswerValueType
      const reponseReponse = reponse.reponse
      if (reponseReponse !== undefined) value = reponseReponse.value
    }
    if (value === undefined) {
      // Si pas de valeur, on garde tous les distracteurs
      return true
    }
    if (Array.isArray(value)) {
      return !value.some((v) => {
        if (v instanceof FractionEtendue) {
          return v.texFraction !== distracteur.toString()
        }
        return distracteur.toString() !== v.toString()
      })
    }
    if (value instanceof FractionEtendue) {
      return value.texFraction !== distracteur.toString()
    }
    return distracteur.toString() !== value.toString()
  })
  return shuffle(distracteursNonSolutions).slice(0, 3)
}
