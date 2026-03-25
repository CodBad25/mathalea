import { miseEnEvidence } from '../../../lib/outils/embellissements'
import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'a601c'
export const refs = {
  'fr-fr': ['TSA5-QCM08'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Madagascar 05/22 : propriétés'
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
      '$f(2x) = f(x) + \\ln (16)$',
      '$f(2x) = 2f(x)$ ',
      '$f(2x) = f(x) + \\ln (24)$',
      '$f(2x) = \\ln (2) + f(x)$',
    ]

    this.enonce =
      " On considère la fonction $f$ définie sur l'intervalle $]0~;~+\\infty[$ par $f(x) = 4\\ln (3x)$.<br>"
    this.enonce +=
      " Pour tout réel $x$ de l'intervalle $]0~;~+\\infty[$, on a :"
    this.correction =
      'Soit $x\\in ]0~;~+\\infty[$. On a : <br>$\\begin{aligned}    f(2x) &= 4 \\ln (3\\times2x)\\\\&= \\ln \\left((3\\times2x)^4\\right)\\\\&= \\ln \\left(2^4\\times(3x)^4\\right)\\\\&=\\ln \\left(2^4\\right)+\\ln\\left((3x)^4\\right)\\\\&=\\ln (16)+4\\ln(3x)\\\\&=\\ln (16)+f(x)\\\\\\end{aligned}$ '
    this.correction += `<br>La bonne réponse est $:${miseEnEvidence('f(2x) = f(x) + \\ln (16)')}$ .`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
