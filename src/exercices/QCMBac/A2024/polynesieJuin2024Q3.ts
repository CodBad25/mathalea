import ExerciceQcm from '../../ExerciceQcm'

export const uuid = '6f117'
export const refs = {
  'fr-fr': ['TSA6-QCM05'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Polynésie 06/2024 : intégration'
export const dateDePublication = '28/10/2024'
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
export default class PolynesieJuin2024Ex2Q3 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = ['$8,3$', '$4,9$', '$1,7$', '$7,5$']
    this.enonce = ` On considère la fonction $g$ définie sur $\\R$ par $g(x) = x^2 \\ln \\left(x^2 + 4\\right) $.
Alors $\\displaystyle\\int_0^2 g'(x)\\:\\text{d}x$ vaut, à $10^{-1}$ près :
<br>`
    this.correction = `On sait que si $g'$ est la dérivée de $g$, alors $g$ est une primitive de la fonction $g'$, donc :
$\\displaystyle\\int_0^2 g'(x)\\:\\text{d}x = \\left[x^2 \\ln \\left(x^2 + 4\\right)\\right]_0^2 = 2^2\\ln \\left(2^2 + 2 \\right) = 4\\ln(4 + 4)  = 4\\ln 8$ ou $4\\ln 2^3 = 3 \\times 4 \\ln 2 = 12\\ln 2 \\approx 8,31$ soit 8,3 au dixième près. \\\\ \\textbf{Réponse B.}
\\smallskip`
  }

  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionOriginale()
  }
}
