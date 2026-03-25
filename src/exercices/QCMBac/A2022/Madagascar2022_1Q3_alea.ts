import { texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import ExerciceQcm from '../../ExerciceQcm'

export const uuid = '5dd79'
export const refs = {
  'fr-fr': ['TSA5-QCM09'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Madagascar 05/22 : asymptote'
export const dateDePublication = '25/02/2025'
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
      'aucune asymptote verticale et une asymptote horizontale.',
      'une asymptote verticale et une asymptote horizontale. ',
      'une asymptote verticale et aucune asymptote horizontale.',
      'aucune asymptote verticale et aucune asymptote horizontale.',
    ]

    this.enonce =
      " On considère la fonction $g$ définie sur l'intervalle $]1~;~+\\infty[$ par : $g(x) = \\dfrac{\\ln (x)}{x - 1}$.<br>"
    this.enonce +=
      ' On note $\\mathcal{C}_g$ la courbe représentative de la fonction $g$ dans un repère orthogonal. <br>La courbe $\\mathcal{C}_g$ admet :'
    this.correction =
      "$\\bullet~~$Limite de la fonction $g$ au voisinage de plus l'infini :<br>"
    this.correction +=
      'On a : $g(x) = \\dfrac{\\ln x}{x} \\times \\dfrac{x}{x - 1}$.<br>'
    this.correction +=
      "Or on sait que d'après les croissances comparées, que $\\displaystyle\\lim_{x \\to +\\infty} \\dfrac{\\ln x}{x} = 0$ et que, en étudiant le quotient des termes de plus au degré,   $\\displaystyle\\lim_{x \\to +\\infty} \\dfrac{x}{x - 1} = 1$,<br>"
    this.correction +=
      ' donc par produit de limites : $\\displaystyle\\lim_{x \\to +\\infty} g(x) = 0$ .<br>'
    this.correction +=
      "L'axe des abscisses est asymptote horizontale au voisinage de plus l'infini.<br>"
    this.correction +=
      '$\\bullet~~$Limite de la fonction $g$ au voisinage de 1 : <br>'
    this.correction +=
      'On a : $g(x) = \\dfrac{\\ln (x)}{x - 1} = \\dfrac{\\ln (x) - \\ln (1)}{x - 1}$<br>'
    this.correction +=
      'donc $\\displaystyle\\lim_{x \\to 1^{+}}g(x)=\\displaystyle\\lim_{x \\to 1^{+}} \\dfrac{\\ln (x) - \\ln (1)}{x - 1}$'
    this.correction +=
      "<br>Ce nombre est égal à la limite du taux d'accroissement de la fonction $\\ln$ au voisinnage de $1$,<br> il est donc égal au nombre dérivé de la fonction logarithme népérien en $x = 1$.<br>"
    this.correction +=
      "Comme sur $]1~;~+\\infty[$, $(\\ln(x))'=\\dfrac 1x$, on a  $\\displaystyle\\lim_{x \\to 1^{+}}g(x)=\\dfrac{1}{1} = 1$ .<br>"
    this.correction +=
      "Il n'y a pas d'asymptote verticale au voisinage de $1$. <br>"
    this.correction += `${texteEnCouleurEtGras('La courbe $\\mathcal{C}_g$ admet donc une asymptote horizontale et aucune asymptote verticale.')}`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
