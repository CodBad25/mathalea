import seedrandom from 'seedrandom'
import { context } from '../../modules/context'
import { mathaleaHandleExerciceSimple } from '../mathalea'
import type { IExercice } from '../types'

/**
 * Génération des exercices avant conversion en questions à cases.
 *
 * `getExercisesFromExercicesParams()` charge les exercices et leur applique
 * leurs paramètres, mais ne les *génère* pas : `listeQuestions` et
 * `autoCorrection` restent vides. Or c'est `autoCorrection` qui porte la
 * structure des réponses — propositions d'un QCM, valeur numérique attendue —
 * dont la lecture optique a besoin. Il faut donc déclencher une passe de
 * génération, et une passe **interactive** : c'est `handleAnswers`, appelé
 * seulement quand `interactif` est vrai, qui remplit `autoCorrection`.
 *
 * La passe modifie l'état global (`context`, générateur aléatoire) : ce module
 * l'isole et restaure ce qu'il a changé, pour ne pas laisser le reste de
 * MathALÉA dans un contexte inattendu.
 */

/**
 * Génère un exercice en contexte interactif, puis restaure le contexte.
 *
 * @param seedOverride graine à utiliser pour cette génération, à la place de
 *   celle de l'exercice. Sert à produire une version différente par élève ;
 *   la graine d'origine est restaurée ensuite, l'exercice n'étant pas censé
 *   garder trace de ce détournement.
 */
export function preparerExercice(
  exercice: IExercice,
  seedOverride?: string,
): void {
  const ex = exercice as IExercice & {
    lastCallback?: string
    nouvelleVersionWrapper?: () => void
  }
  const interactifInitial = exercice.interactif
  const isHtmlInitial = context.isHtml
  const isAmcInitial = context.isAmc
  const seedInitial = exercice.seed

  try {
    // `lastCallback` mémoïse la dernière génération : sans le vider, l'appel
    // suivant est ignoré et `autoCorrection` reste vide
    ex.lastCallback = ''
    exercice.interactif = true
    context.isHtml = true
    context.isAmc = false
    if (seedOverride != null) exercice.seed = seedOverride
    seedrandom(exercice.seed, { global: true })

    if (exercice.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercice, true)
    } else if (typeof ex.nouvelleVersionWrapper === 'function') {
      ex.nouvelleVersionWrapper()
    }
  } finally {
    exercice.interactif = interactifInitial
    context.isHtml = isHtmlInitial
    context.isAmc = isAmcInitial
    exercice.seed = seedInitial
  }
}

/**
 * Génère une liste d'exercices.
 *
 * @param seedOverride si fourni, toutes les générations partent de cette graine
 *   au lieu de celle propre à chaque exercice (un sujet par élève)
 */
export function preparerExercices(
  exercices: readonly IExercice[],
  seedOverride?: string,
): void {
  for (const exercice of exercices) preparerExercice(exercice, seedOverride)
}
