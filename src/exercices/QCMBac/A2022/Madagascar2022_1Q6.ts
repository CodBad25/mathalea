import { texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'a03b4'
export const refs = {
  'fr-fr': ['TSA5-QCM13'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Madagascar 05/22 : point d'inflexion"
export const dateDePublication = '07/03/2025'
/**
 * Ceci est un exo construit à partir d'une question de qcm de Bac.
 * Il utilise la classe ExerciceQcm qui définit les contours de l'exo (sans version aléatoire)
 * Ce moule à exo dispose d'une méthode qcmCamExport qui permet de récupérer le JSON de la question et de la reponse pour qcmCam.
 * Il est interactif et dispose d'un export AMC d'office
 */
/**
 *
 * @author Stéphane Guyon
 *
 */
export default class SujetZero2024Ex5Q5 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = [
      '1', // Réponse correcte (b)
      '0', // Mauvaise réponse (a)
      '2', // Mauvaise réponse (c)
      '3', // Mauvaise réponse (d)
    ]

    this.enonce =
      "On considère la fonction $h$ définie sur l'intervalle $]0~;~2]$ par $h(x) = x^2(1 + 2\\ln (x)).$"
    this.enonce +=
      "<br>On admet que $h$ est deux fois dérivable sur l'intervalle $]0~;~2]$."
    this.enonce +=
      "<br>On note $h'$ sa dérivée et on admet que, pour tout réel $x$ de l'intervalle $]0~;~2]$, on a : $h'(x) = 4x(1 + \\ln (x)).$"
    this.enonce +=
      ' <br>On note $\\mathcal{C}_h$ la courbe représentative de $h$ dans un repère du plan. '
    this.enonce +=
      "<br>Sur l'intervalle $]0~;~2]$, le nombre de points d'inflexion de la courbe $\\mathcal{C}_h$ est égal à :<br>"

    this.correction =
      "La fonction $h'$ est dérivable sur $]0~;~2]$, et sa dérivée seconde est :<br>"
    this.correction +=
      "$h''(x) = 4(1 + \\ln (x)) + 4x \\times \\dfrac{1}{x} = 4 + 4\\ln (x) + 4 = 8 + 4\\ln (x) = 4(2 + \\ln (x))$.<br>"
    this.correction += 'De plus, la dérivée troisième est :<br>'
    this.correction += "$h'''(x) = \\dfrac{4}{x}$.<br>"
    this.correction +=
      "Sur l'intervalle $]0~;~2]$, $h'''(x) > 0$, donc $h''(x)$ est croissante.<br>"
    this.correction += "Elle s'annule si :<br>"
    this.correction += '$\\begin{aligned}'
    this.correction += "h''(x) = 0 &\\iff 2 + \\ln (x) = 0 \\\\"
    this.correction += '&\\iff \\ln (x) = -2 \\\\'
    this.correction += '&\\iff x = \\mathrm{e}^{-2} \\approx 0,135 \\in ]0~;~2]'
    this.correction += '\\end{aligned}$<br>'
    this.correction +=
      "La dérivée seconde s'annule donc une seule fois sur l'intervalle $]0~;~2]$ en changeant de signe.<br>"
    this.correction += `${texteEnCouleurEtGras("Il y a donc un seul point d'inflexion. ")}`
  }

  constructor() {
    super()
    this.options = { ...this.options, vertical: true }
    this.versionOriginale()
  }
}
