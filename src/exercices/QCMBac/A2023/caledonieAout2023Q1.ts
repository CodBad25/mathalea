import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'd09fe'
export const refs = {
  'fr-fr': ['TSA6-QCM01'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Nouvelle Calédonie 08/23 : primitive'
export const dateDePublication = '05/11/2024'
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
      '$F(x) = 1+x\\mathrm{e}^x$',
      '$F(x) = (1+x)\\mathrm{e}^x$',
      '$F(x) = (2 + x)\\mathrm{e}^x$',
      '$F(x) = \\left(\\dfrac{x^2}{2}  + x\\right)\\mathrm{e}^x$',
    ]

    this.enonce = ` On considère la fonction $f$ définie sur $\\mathbb R$ par: $f(x) = (x + 1)\\mathrm{e}^x$. <br>
    Une primitive $F$ de $f$ sur $\\mathbb R$ est définie par:`
    this.correction = 'Si on dérive $F(x) = 1+x\\mathrm{e}^x$,<br>'
    this.correction +=
      'on obtient : $F^{\\prime}(x) = 1 \\times \\mathrm{e}^x + x\\mathrm{e}^x= (1+x)\\mathrm{e}^x$.<br>'
  }

  constructor() {
    super()
    this.options = { ...this.options, vertical: true }
    this.versionOriginale()
  }
}
