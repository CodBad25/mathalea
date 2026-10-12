import { context } from '../../modules/context'
import {
  addMultiMathfield,
  type DataOptionsMultiMathfield,
} from '../customElements/MultiMathfield'
import { createList } from '../format/lists'
import type { AnswerType, IExercice, Valeur } from '../types'
import { toutAUnPoint } from './fonctionsBaremes'
import { handleAnswers } from './gestionInteractif'

/** Noms des champs du `multi-mathfield`, un par sous-question (a → field0…). */
const FIELD_NAMES = [
  'field0',
  'field1',
  'field2',
  'field3',
  'field4',
  'field5',
  'field6',
  'field7',
  'field8',
] as const

export type SubQuestion = {
  /** Énoncé de la sous-question, sans son repère « a) » ajouté par la liste. */
  question: string
  /** Correction de la sous-question, affichée sous le même repère. */
  correction: string
  /** Réponse attendue. Sans réponse, la sous-question n'a pas de champ. */
  answer?: AnswerType
  /** Options du champ : clavier, texte après, liste déroulante, QCM… */
  field?: NonNullable<DataOptionsMultiMathfield['field0']>
}

export type SubQuestionsOptions = {
  /**
   * Barème de la question. Par défaut, un point par sous-question à
   * réponse : le total ne doit pas dépendre du tirage.
   */
  bareme?: (listePoints: number[]) => [number, number]
}

/**
 * Numérote les sous-questions a), b), c)… d'une question, place le champ de
 * chacune dans son item et sa correction sous le même repère.
 *
 * Toutes les réponses forment une seule question interactive
 * (`multi-mathfield`) : la question `questionIndex` garde son numéro et son
 * barème est fixe.
 * @returns l'énoncé et la correction, à ajouter à ceux de la question
 * @see documentation/developpement/auteurs-exercices/complements/sous-questions.md
 */
export function createSubQuestions(
  exercice: IExercice,
  questionIndex: number,
  subQuestions: SubQuestion[],
  { bareme = toutAUnPoint }: SubQuestionsOptions = {},
): { question: string; correction: string } {
  if (subQuestions.length > FIELD_NAMES.length) {
    window.notify(
      `createSubQuestions() gère au plus ${FIELD_NAMES.length} sous-questions`,
      { exercice: exercice.uuid, nbSousQuestions: subQuestions.length },
    )
  }
  const answers: Valeur = {}
  const dataOptions: DataOptionsMultiMathfield = {}
  subQuestions.forEach(({ answer, field }, k) => {
    const name = FIELD_NAMES[k]
    if (answer == null || name == null) return
    answers[name] = answer
    dataOptions[name] = field ?? {}
  })
  const hasAnswers = Object.keys(answers).length > 0
  const isInteractive =
    hasAnswers && exercice.interactif && context.isHtml && !context.isTypst

  const question = isInteractive
    ? addMultiMathfield(exercice, questionIndex, {
        dataTemplate: createList({
          items: subQuestions.map(({ question }, k) =>
            k < FIELD_NAMES.length && FIELD_NAMES[k] in answers
              ? `${question} %{${FIELD_NAMES[k]}}`
              : question,
          ),
          style: 'alpha',
        }),
        dataOptions,
      })
    : createList({
        items: subQuestions.map(({ question }) => question),
        style: 'alpha',
      })

  if (hasAnswers) {
    handleAnswers(
      exercice,
      questionIndex,
      { ...answers, bareme },
      { formatInteractif: 'multi-mathfield' },
    )
  }

  return {
    question,
    correction: createList({
      items: subQuestions.map(({ correction }) => correction),
      style: 'alpha',
    }),
  }
}
