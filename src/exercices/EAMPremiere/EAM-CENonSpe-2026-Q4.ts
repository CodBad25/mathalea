import Decimal from 'decimal.js'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'
import { randint } from '../../modules/outils'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'

export const uuid = '13606'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Trouver le calcul pour une baisse en pourcentage '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ4CEns2026 extends ExerciceQcmA {
   private appliquerLesValeurs(prix: number, p: number): void {
    const decimalP = new Decimal(p).div(100) // p/100, ex. 0,15
    const coeffBaisse = new Decimal(1).minus(decimalP) // 1 - p/100, ex. 0,85
    const coeffHausse = new Decimal(1).plus(decimalP) // 1 + p/100, ex. 1,15

    this.enonce = `Un article coûtant $${texNombre(prix)}$ € subit une baisse de $${p}\\,\\%$. <br>
    Pour obtenir le prix de cet article après la baisse, il faut faire le calcul :`

    this.correction = `Une baisse de $${p}\\,\\%$ revient à multiplier par le coefficient multiplicateur $CM=1-\\dfrac{${p}}{100}=1-${texNombre(decimalP)}=${texNombre(coeffBaisse)}$.<br>
Le calcul à effectuer est donc $${miseEnEvidence(`${texNombre(prix)}\\times ${texNombre(coeffBaisse)}`)}$.`

    this.reponses = [
      `$${texNombre(prix)}\\times ${texNombre(coeffBaisse)}$`,
      `$${texNombre(prix)}-${texNombre(decimalP)}$`,
      `$${texNombre(prix)}\\times ${texNombre(coeffHausse)}$`,
      `$${texNombre(prix)}\\times ${texNombre(decimalP)}$`,
    ]
  }

  versionOriginale: () => void = () => {
    // 300 € avec une baisse de 15 %
    this.appliquerLesValeurs(300, 15)
  }

  versionAleatoire = () => {
    // Pont avec le mécanisme Can : si le méta a coché « sujet officiel »,
    // on produit la version originale figée au lieu d'un tirage aléatoire.
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    let compteur = 0
    do {
      const prix = 100 * randint(2, 9) // multiple de 100
      const p = choice([5, 15, 25, 35, 45]) // multiple de 5, pas de 10
      this.appliquerLesValeurs(prix, p)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
