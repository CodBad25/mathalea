import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre, texPrix } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6eff5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Déterminer un pourcentage de remise'
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ1AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(prixAvant: number, prixApres: number): void {
    const sol = ((prixAvant - prixApres) / prixAvant) * 100
    const dist1 = prixApres / prixAvant
    const dist2 = prixApres // ne pas prendre un prix Apres = à la remise
    const dist3 = (prixAvant - prixApres) / prixAvant

    this.enonce = `Un Objet coûtait $${texPrix(prixAvant)}\\text{ €}$.<br>
    Après une remise, il coûte $${texPrix(prixApres)}\\text{ €}$.<br>
    Quel était le pourcentage de cette remise ?`

    this.correction = `Le prix à payer après la remise est de $${texPrix(prixApres)}\\text{ €}$, soit $\\dfrac{${texNombre(prixApres, 0)}}{${texNombre(prixAvant, 0)}} \\times 100 = ${texNombre((prixApres / prixAvant) * 100, 0)}\\%$ du prix initial.<br>
    Il y a donc $100\\,\\%- ${texNombre((prixApres / prixAvant) * 100, 0)}\\,\\%=${miseEnEvidence(texNombre(sol, 0) + '\\,\\%')}$ de remise.`

    this.reponses = [
      `$${texNombre(sol, 2)}\\,\\%$`,
      `$${texNombre(dist1, 2)}\\,\\%$`,
      `$${texNombre(dist2, 2)}\\,\\%$`,
      `$${texNombre(dist3, 2)}\\,\\%$`,
    ]
  }

  versionOriginale: () => void = () => {
    // Version de l'image : 500 élèves, 20 %  => 100
    this.appliquerLesValeurs(100, 80)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const prixAvant = choice([
        100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
      ])
      const pourcentageRemise = choice([10, 20, 30, 40])
      const prixApres = Math.round(
        (prixAvant * (100 - pourcentageRemise)) / 100,
      )
      this.appliquerLesValeurs(prixAvant, prixApres)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
