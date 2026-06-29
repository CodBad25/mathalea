import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../../lib/outils/embellissements'
import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'e1d48'
export const refs = {
  'fr-fr': ['TSA5-QCM21'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Polynésie 05/22 : limite'
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
      '$\\displaystyle\\lim_{x \\to 0} g(x) = 0$', // Réponse correcte (c)
      '$\\displaystyle\\lim_{x \\to 0} g(x) = +\\infty$', // Mauvaise réponse (a)
      '$\\displaystyle\\lim_{x \\to 0} g(x) = -\\infty$', // Mauvaise réponse (b)
      "La fonction $g$ n'admet pas de limite en 0.", // Mauvaise réponse (d)
    ]

    this.enonce =
      'On considère la fonction $g$ définie sur $]0~;~+\\infty[$ par '
    this.enonce += '$g(x) = x^2[1 - \\ln(x)].$<br>'
    this.enonce +=
      'Parmi les quatre affirmations suivantes, laquelle est correcte ?'

    this.correction = 'On décompose $g(x)$ en deux termes :<br>'
    this.correction += '$g(x) = x^2 - x^2 \\ln(x).$<br>'
    this.correction += 'On sait que :<br>'
    this.correction += '- $\\displaystyle\\lim_{x \\to 0} x^2 = 0$,<br>'
    this.correction +=
      '- $\\displaystyle\\lim_{x \\to 0} x^2 \\ln(x) = 0$ (par croissances comparées).<br>'
    this.correction += 'Donc, par somme de limites :<br>'
    this.correction += '$\\displaystyle\\lim_{x \\to 0} g(x) = 0.$<br>'
    this.correction += `La bonne réponse est donc la réponse $${miseEnEvidence('\\displaystyle\\lim_{x \\to 0} g(x) = 0')}$.`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
