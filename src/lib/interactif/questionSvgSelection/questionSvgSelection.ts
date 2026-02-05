import { context } from '../../../modules/context'
import type { IExercice } from '../../types'
import '../svgSelection/SvgSelectionElement'

/**
 * Vérifie la réponse à une question avec sélection d'SVG
 * @param {object} exercice l'exercice appelant pour pouvoir atteindre ses propriétés.
 * @param {number} i le numéro de la question
 * @returns {string} 'OK' si la réponse est correcte, 'KO' sinon
 */
export function verifQuestionSvgSelection(exercice: IExercice, i: number) {
  const spanReponseLigne = document.querySelector(
    `#resultatCheckEx${exercice.numeroExercice}Q${i}`,
  )
  if (spanReponseLigne == null) {
    window.notify(
      "l'exercice ayant appelé verifQuestionSvgSelection() n'a pas correctement défini le span pour le smiley",
      { exercice: JSON.stringify(exercice) },
    )
  }
  const selection = document.querySelector(
    `#svgSelectionEx${exercice.numeroExercice}Q${i}`,
  ) as any
  let value: string = ''

  if (selection) {
    value = String(selection.value) // Convertir en string pour comparaison
  }
  const reponse = exercice.autoCorrection[i]?.reponse?.valeur?.reponse?.value
  // Sauvegarde pour les exports Moodle, Capytale...
  if (exercice.answers === undefined) {
    exercice.answers = {}
  }
  if (selection) {
    exercice.answers[selection.id] = String(selection.value)
  }
  const resultat = Array.isArray(reponse)
    ? reponse.includes(value)
      ? 'OK'
      : 'KO'
    : value === reponse
      ? 'OK'
      : 'KO'
  if (resultat === 'OK') {
    if (spanReponseLigne) {
      spanReponseLigne.innerHTML = '😎'
    }
  } else {
    if (spanReponseLigne) {
      spanReponseLigne.innerHTML = '☹️'
    }
  }
  if (spanReponseLigne)
    (spanReponseLigne as HTMLElement).style.fontSize = 'large'
  return resultat
}

/**
 * Fonction pour créer une sélection d'SVG dans un exercice interactif.
 * @param {Exercice} exercice l'exercice appelant pour pouvoir atteindre ses propriétés.
 * @param {number} i le numéro de la question
 * @param {string[]} svgs les SVG à sélectionner
 * @param {number} correctValue la valeur correcte (nombre en base n)
 * @param {string} [style] le style à appliquer au conteneur
 * @returns {string} le code HTML du conteneur de sélection SVG
 */
export function selectionSvg(
  exercice: IExercice,
  i: number,
  svgs: string[],
  correctValue: number | number[],
  style?: string,
) {
  if (!exercice.interactif || !context.isHtml) return ''

  style = style ? ` style="${style}"` : ''
  if (
    context.isHtml &&
    exercice?.autoCorrection[i]?.reponse?.param?.formatInteractif !==
      'svgSelection'
  ) {
    if (exercice?.autoCorrection == null) exercice.autoCorrection = []
    if (exercice?.autoCorrection[i] == null) exercice.autoCorrection[i] = {}
    if (exercice?.autoCorrection[i].reponse == null)
      exercice.autoCorrection[i].reponse = {}
    if (exercice.autoCorrection[i].reponse.param == null)
      exercice.autoCorrection[i].reponse.param = {}
    exercice.autoCorrection[i].reponse.param.formatInteractif = 'svgSelection'
  }
  let result =
    `<svg-selection class="mx-2 svgSelection" id="svgSelectionEx${exercice.numeroExercice}Q${i}"${style} svgs="` +
    encodeURIComponent(JSON.stringify(svgs)) +
    `"></svg-selection>`
  result += `<span id="resultatCheckEx${exercice.numeroExercice}Q${i}"></span>`

  // Stocker la réponse correcte
  return setReponseSelection(exercice, i, correctValue, result)
}

/**
 * Enregistre la réponse correcte pour une question de sélection SVG
 * @param exercice l'exercice
 * @param i le numéro de la question
 * @param correctValue la valeur correcte en base n
 * @param htmlCode le code HTML généré
 * @returns le code HTML
 */
function setReponseSelection(
  exercice: IExercice,
  i: number,
  correctValue: number | number[],
  htmlCode: string,
): string {
  if (exercice.autoCorrection[i] === undefined) {
    exercice.autoCorrection[i] = {}
  }
  if (exercice.autoCorrection[i].reponse === undefined) {
    exercice.autoCorrection[i].reponse = {}
  }
  const rep = exercice.autoCorrection[i].reponse
  if (rep != null) {
    rep.valeur = {
      reponse: {
        value: Array.isArray(correctValue)
          ? correctValue.map(String)
          : String(correctValue), // Stocker en string pour conformité au type
      },
    }
  }
  return htmlCode
}
