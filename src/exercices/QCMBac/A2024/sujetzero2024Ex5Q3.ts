import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'd8a6b'
export const refs = {
  'fr-fr': ['TSA2-QCM01'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Sujet zéro 2024 : convexité'
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
export default class SujetZero2024Ex5Q3 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = [
      "La fonction $f$ est concave sur l'intervalle $[0~;~\\pi]$<br>",
      "La fonction $f$ est convexe sur l'intervalle $[0~;~\\pi]$<br>",
      "La fonction $f$ admet sur l'intervalle $[0~;~\\pi]$ un unique point d'inflexion<br>",
      "La fonction $f$ admet sur l'intervalle $[0~;~\\pi]$ exactement deux points d'inflexion<br>",
    ]

    this.enonce = `On considère la fonction $f$ définie sur l'intervalle $[0~;~\\pi]$ par $f(x) = x + \\sin (x)$.<br>
  On admet que $f$ est deux fois dérivable.`
    this.correction =
      "$f'(x)=1+\\cos(x)$ et $f'' (x)=-\\sin(x)\\leqslant 0$ sur $[0~;~\\pi]$, donc la fonction $f$ est concave sur cet intervalle."
  }

  constructor() {
    super()
    this.options.vertical = true
    this.versionOriginale()
  }
}
