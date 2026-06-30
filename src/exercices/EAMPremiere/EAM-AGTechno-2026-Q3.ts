import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6ebf5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  'Déterminer un pourcentage global après une hausse puis une baisse (ou inversement)'
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ3AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    pourcentage1: number,
    pourcentage2: number,
  ): void {
    const pGlobal = ((100 + pourcentage1) * (100 + pourcentage2)) / 100
    const diff = pourcentage1 + pourcentage2
    const sol =
      pGlobal < 100
        ? `Baisse de $${texNombre(100 - pGlobal, 2)}\\,\\%$`
        : `Hausse de $${texNombre(pGlobal - 100, 2)}\\,\\%$`
    const dist1 =
      diff < 0
        ? `Baisse de $${texNombre(-diff, 2)}\\,\\%$`
        : `Hausse de $${texNombre(diff, 2)}\\,\\%$`
    const dist2 =
      diff < 0
        ? `Hausse de $${texNombre(-diff, 2)}\\,\\%$`
        : `Baisse de $${texNombre(diff, 2)}\\,\\%$`
    const dist3 =
      pGlobal < 100
        ? `Baisse de $${texNombre(pGlobal, 2)}\\,\\%$`
        : `Hausse de $${texNombre(pGlobal, 2)}\\,\\%$`

    this.enonce = `Un prix ${pourcentage1 > 0 ? 'augmente' : 'diminue'} de $${texNombre(Math.abs(pourcentage1), 2)}\\,\\%$ puis ${pourcentage2 > 0 ? 'augmente' : 'diminue'} de $${texNombre(
      Math.abs(pourcentage2),
      2,
    )}\\,\\%$.<br>
    Quelle est l'évolution globale de ce prix ?`

    this.correction = `L'évolution globale se calcule en multipliant les coefficients multiplicateurs :<br>
     $\\dfrac{100${ecritureAlgebrique(pourcentage1)}}{100} \\times \\dfrac{100${ecritureAlgebrique(pourcentage2)}}{100} =
     ${texNombre((100 + pourcentage1) / 100, 2)}\\times ${texNombre((100 + pourcentage2) / 100, 2)} = ${texNombre(pGlobal / 100, 2)}=${texNombre(pGlobal, 2)}\\,\\%$.<br>
     Ce coefficient multiplicateur correspond à une ${texteEnCouleurEtGras(`${pGlobal > 100 ? 'hausse de ' : 'baisse de '}`)}$${miseEnEvidence(texNombre(Math.abs(pGlobal - 100), 2) + '\\,\\%')}$.`

    this.reponses = [sol, dist1, dist2, dist3]
  }

  versionOriginale: () => void = () => {
    // Version de l'image : 500 élèves, 20 %  => 100
    this.appliquerLesValeurs(10, -20)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const signe1 = choice([-1, 1])
      const signe2 = choice([-1, 1], signe1)
      const pourcentage1 = choice([10, 20, 30, 40])
      const pourcentage2 = choice([10, 20, 30, 40], pourcentage1)

      const categorie2 = choice(['sont mineurs', 'sont étudiants'])
      this.appliquerLesValeurs(signe1 * pourcentage1, signe2 * pourcentage2)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
