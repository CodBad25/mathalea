import ExerciceQcm from '../../ExerciceQcm'

export const uuid = 'c573b'
export const refs = {
  'fr-fr': ['TSA1-QCM04'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Métropole 09/23 : nature et variations'
export const dateDePublication = '03/11/2024'
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
export default class metropoleSept2023Q4 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = [
      'une suite géométrique de raison 1,2  ',
      'une suite décroissante ',
      'une suite arithmétique de raison $60$',
      'une suite ni géométrique ni arithmétique',
    ]

    this.enonce = `On considère la suite $\\left(u_n\\right)$ définie sur $\\mathbb N$ par:
$u_0 = 15$ et pour tout entier naturel $n$ :  $u_{n+1} = 1,2u_n + 12.$<br>

On considère la suite $\\left(v_n\\right)$ définie sur $\\mathbb N$ par : $v_n = u_n + 60$. <br>

La suite $\\left(v_n\\right)$ est:`

    this.correction = 'On a quel que soit $n \\in \\mathbb N$ :<br> '
    this.correction +=
      '$v_{n+1} = u_{n+1} + 60 $<br>$\\qquad=  1,2u_n + 12 + 60$ <br>$\\qquad= 1,2u_n + 72 $<br>$\\qquad= 1,2\\left(u_n + 60\\right)$ <br>$\\qquad= 1,2v_n$<br>'
    this.correction +=
      'Cette égalité montre que la suite $\\left(v_n\\right)$ est géométrique de raison 1,2.'
  }

  constructor() {
    super()
    this.options.vertical = true
    this.versionOriginale()
  }
}
