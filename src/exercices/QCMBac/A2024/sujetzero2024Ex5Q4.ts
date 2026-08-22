import ExerciceQcm from '../../ExerciceQcm'

export const uuid = '1bc77'
export const refs = {
  'fr-fr': ['TSG1-QCM04'],
  'fr-ch': ['NR'],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Sujet zéro 2024 : listes ordonnées.'
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
export default class SujetZero2024Ex5Q4 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = [
      '$2^{10}$',
      '$2 \\times 10$',
      '$1 \\times 2 \\times 3 \\times \\cdots \\times 10$',
      '$\\dfrac{1 \\times 2 \\times 3 \\times \\cdots \\times 10}{1 \\times 2}$',
    ]

    this.enonce = `On effectue dix lancers d'une pièce de monnaie. Le résultat d'un lancer est "pile" ou "face".<br>
    On note la liste ordonnée des dix résultats.<br>
    Quel est le nombre de listes ordonnées possibles?`
    this.correction =
      'Il y a 2 résultats possibles si on effectue 1 lancer, $2^2$ résultats possibles si on effectue 2 lancers, etc., $2^{10}$ résultats possibles si on effectue 10 lancers.'
  }

  constructor() {
    super()
    this.options.vertical = true
    this.versionOriginale()
  }
}
