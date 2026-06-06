import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence, texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'

import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '081b4'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Calculer un taux d\'évolution '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ3ANs2026 extends ExerciceQcmA {
   private appliquerLesValeurs(milliemes: number): void {
    const k = milliemes / 1000 // coefficient multiplicateur (ex. 0,845)
    const variationMilliemes = milliemes - 1000 // signé : < 0 baisse, > 0 hausse
    const hausse = variationMilliemes > 0
    const ecart = Math.abs(variationMilliemes) // écart à 1 en millièmes (ex. 155)

    const t = ecart / 10 // taux de variation, en % (ex. 15,5)
    const variationDecimale = variationMilliemes / 1000 // taux signé décimal (ex. −0,155)
    const variationPercent = variationMilliemes / 10 // taux signé en % (ex. −15,5)
    const pourcentageCoeff = milliemes / 10 // coefficient lu comme un % (ex. 84,5)
    const tDix = ecart / 100 // erreur de virgule sur le taux (ex. 1,55)

    const sens = hausse ? 'augmenté' : 'baissé'
    const sensContraire = hausse ? 'baissé' : 'augmenté'

    this.enonce = `Le prix d'un article est multiplié par $${texNombre(k)}$. Cela signifie que le prix de cet article a :`

    this.correction = `Le coefficient multiplicateur (CM) est $${texNombre(k)}$.<br>
Comme $${texNombre(k)}${hausse ? '>' : '<'}1$, il s'agit d'une ${hausse ? 'hausse' : 'baisse'}.<br>
On calcule le taux d'évolution $t$ associé à ce coefficient :<br>
$\\begin{aligned}
t&=CM-1\\\\
t&=${texNombre(k)}-1\\\\
&=${texNombre(variationDecimale)}\\\\
&=${texNombre(variationPercent)}\\,\\%
\\end{aligned}$<br>
Le prix a donc ${texteEnCouleurEtGras(sens+' de ')}  $${miseEnEvidence(`${texNombre(t)}\\,\\%`)}$.`

    this.reponses = [
      `${sens} de $${texNombre(t)}\\,\\%$`,
      `augmenté de $${texNombre(pourcentageCoeff)}\\,\\%$`,
      `${sens} de $${texNombre(tDix)}\\,\\%$`,
      `${sensContraire} de $${texNombre(t)}\\,\\%$`,
    ]
  }

  versionOriginale: () => void = () => {
    // ×0,845 → baisse de 15,5 %
    this.appliquerLesValeurs(845)
  }

  versionAleatoire = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
   
    const milliemes = choice([
      955, 925, 875, 845, 815, 775, 755, // baisses
      1045, 1075, 1125, 1155, 1185, 1225, 1245, // hausses
    ])
    this.appliquerLesValeurs(milliemes)
  }

  constructor() {
    super()
    this.versionAleatoire()
      this.options = { vertical: true}
  }
}
