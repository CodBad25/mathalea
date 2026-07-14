import type Figure from 'apigeom'

/**
 * JSON d'une figure ApiGeom destiné à être stocké comme réponse d'élève.
 *
 * Par rapport à `figure.json`, on retire le bloc `options` et l'indentation.
 * Les options (dont la barre d'outils) sont imposées par l'exercice au moment de
 * sa génération, jamais modifiées par l'élève, et `loadJson()` les laisse
 * inchangées si elles sont absentes : les renvoyer est redondant et représente
 * plus de la moitié du poids de la réponse.
 *
 * Ce poids est critique pour les LMS : SCORM 1.2 plafonne `cmi.suspend_data` à
 * 4 096 caractères, ce qu'une figure atteignait à elle seule.
 */
export function figureAnswerJson(figure: Figure): string {
  const { options: _options, ...figureWithoutOptions } = JSON.parse(figure.json)
  return JSON.stringify(figureWithoutOptions)
}
