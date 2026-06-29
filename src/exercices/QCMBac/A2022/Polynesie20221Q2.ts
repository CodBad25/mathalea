import { texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'fb224'
export const refs = {
  'fr-fr': ['TSA6-QCM09'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Polynésie 05/22 : primitive'
export const dateDePublication = '09/03/2025'
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
      '$x \\longmapsto x \\ln (x) - x$', // Réponse correcte (c)
      '$x \\longmapsto \\ln (x)$', // Mauvaise réponse (a)
      '$x \\longmapsto \\dfrac{1}{x}$', // Mauvaise réponse (b)
      '$x \\longmapsto \\dfrac{\\ln (x)}{x}$', // Mauvaise réponse (d)
    ]

    this.enonce =
      'La fonction $x \\longmapsto \\ln (x)$ admet pour primitive sur $]0~;~+ \\infty[$ la fonction :'

    this.correction =
      "Pour déterminer si $f(x) = \\ln(x)$ admet pour primitive l'une des fonctions proposées, il suffit de les dériver.<br>"
    this.correction += 'Soit $g(x) = x \\ln (x) - x$.<br>'
    this.correction +=
      'La fonction $g$ est dérivable comme somme et produit de fonctions dérivables sur $]0~;~+ \\infty[$.<br>'
    this.correction += 'On calcule sa dérivée :<br>'
    this.correction += '$\\begin{aligned}'
    this.correction +=
      "g'(x) &= 1 \\times \\ln(x) + x \\times \\dfrac{1}{x} - 1 \\\\"
    this.correction += '&= \\ln(x) + 1 - 1 \\\\'
    this.correction += '&= \\ln(x) \\\\'
    this.correction += '&= f(x)'
    this.correction += '\\end{aligned}$<br>'
    this.correction += `Ainsi, une primitive de $f(x) = \\ln(x)$ est  ${texteEnCouleurEtGras('$g(x) = x \\ln (x) - x$ ')}`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
