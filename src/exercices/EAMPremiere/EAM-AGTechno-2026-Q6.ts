import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { fraction } from '../../modules/fractions'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6efa5'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Calculer une fraction de fraction'
export const dateDePublication = '29/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Jean-Claude Lhote
 *
 */
export default class AutoQ6AGt2026 extends ExerciceQcmA {
  private appliquerLesValeurs(num: number, den: number, den2: number): void {
    const sol = fraction(num, den).produitFraction(
      fraction(1, den2),
    ).texFractionSimplifiee
    const dist1 = fraction(num, den).multiplieEntier(den2).texFractionSimplifiee
    const dist2 = fraction(1, den * den2).texFractionSimplifiee
    const dist3 = fraction(den2, den).texFractionSimplifiee

    this.enonce = `On considère $A=\\dfrac{\\dfrac{${num}}{${den}}}{${den2}}$ :<br>`

    this.correction = `Diviser par $${den2}$ revient à multiplier par son inverse : $\\dfrac{1}{${den2}}$<br>
    Ainsi :<br>
    $\\begin{aligned}
    A&=\\dfrac{\\dfrac{${num}}{${den}}}{${den2}}\\\\
    &=\\dfrac{${num}}{${den}}\\times \\dfrac{1}{${den2}}\\\\
    &=\\dfrac{${num}}{${den} \\times ${den2}}\\\\
    &=\\dfrac{\\cancel{${num}}}{${den} \\times \\cancel{${num}}\\times${den2 / num}} \\\\
    &= ${miseEnEvidence(sol)}
    \\end{aligned}$`

    this.reponses = [sol, dist1, dist2, dist3].map((x) => `$A=${x}$`)
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(5, 3, 15)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const num = choice([2, 3, 5, 7])
      const den = choice([2, 3, 5, 7], num)
      const den2 = num * choice([2, 3, 5, 7], num)
      this.appliquerLesValeurs(num, den, den2)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
