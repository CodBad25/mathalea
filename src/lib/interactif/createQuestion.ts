import type { AnswerType, IExercice } from '../types'
import { handleAnswers } from './gestionInteractif'
import { ajouteChampTexteMathLive } from './questionMathLive'
import {
  createSubQuestions,
  type SubQuestion,
  type SubQuestionsOptions,
} from './subQuestions'

export type QuestionDescription = {
  /** Énoncé de la question, ou consigne commune à ses sous-questions. */
  question: string
  /** Correction de la question, ou explication commune à ses sous-questions. */
  correction?: string
  /** Réponse attendue d'une question sans sous-question. */
  answer?: AnswerType
  /** Options du champ d'une question sans sous-question. */
  field?: { keyboard?: string; texteAvant?: string; texteApres?: string }
  /** Sous-questions a), b), c)… affichées après `question`. */
  subQuestions?: SubQuestion[]
} & SubQuestionsOptions

/**
 * Remplit la question `i` de l'exercice : énoncé, correction et réponses.
 *
 * Une question a soit une réponse (`answer`), soit des sous-questions
 * (`subQuestions`), chacune avec sa réponse et sa correction.
 * @see documentation/developpement/auteurs-exercices/complements/sous-questions.md
 */
export function createQuestion(
  exercice: IExercice,
  i: number,
  {
    question,
    correction = '',
    answer,
    field = {},
    subQuestions,
    bareme,
  }: QuestionDescription,
): void {
  if (subQuestions != null) {
    if (answer != null) {
      window.notify(
        'createQuestion() : mettre les réponses dans les sous-questions',
        { exercice: exercice.uuid, question: i },
      )
    }
    const sub = createSubQuestions(exercice, i, subQuestions, { bareme })
    exercice.listeQuestions[i] = question + sub.question
    exercice.listeCorrections[i] = correction + sub.correction
    return
  }
  const { keyboard = '', texteAvant, texteApres } = field
  exercice.listeQuestions[i] =
    question +
    (answer == null
      ? ''
      : ajouteChampTexteMathLive(exercice, i, keyboard, {
          texteAvant,
          texteApres,
        }))
  exercice.listeCorrections[i] = correction
  if (answer != null) {
    handleAnswers(
      exercice,
      i,
      bareme == null ? { reponse: answer } : { reponse: answer, bareme },
    )
  }
}
