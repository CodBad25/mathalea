import ExerciceQcm from '../../ExerciceQcm'

export const uuid = '999ee'
export const refs = {
  'fr-fr': ['TSA1-QCM03'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Métropole 09/23 : Python'
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
export default class metropoleSept2023Q3 extends ExerciceQcm {
  versionOriginale: () => void = () => {
    this.reponses = [
      'u$\\leqslant {10000}$',
      'u $={10000}$  ',
      'u$> {10000}$',
      '$n\\leqslant{10000}$',
    ]

    this.enonce = `On considère la suite $\\left(u_n\\right)$ définie sur $\\mathbb N$ par:
$u_0 = 15$ et pour tout entier naturel $n$ :  $u_{n+1} = 1,2u_n + 12.$<br>

La fonction Python suivante, dont la ligne 4 est incomplète, <br>doit renvoyer la plus petite valeur de l'entier $n$ telle que $u_n > 10000$.<br>

<br>def seuil() :<br>
$\\qquad$ n=0<br>
$\\qquad$ u=15<br>
$\\qquad$ while .............. :<br>
$\\qquad\\qquad$ n=n+1<br>
$\\qquad\\qquad$ u=1,2$*$u+12<br>
$\\qquad$ return(n)<br><br>


À la ligne 4, on complète par :`

    this.correction =
      'Pour sortir de la boucle quand $u>10000$, la boucle while doit fonctionner tant que $u\\leqslant 10000$.'
  }

  constructor() {
    super()
    this.options.vertical = true
    this.versionOriginale()
  }
}
