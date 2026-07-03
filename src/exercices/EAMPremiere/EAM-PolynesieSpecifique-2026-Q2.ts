import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique, rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'psq02'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation du premier degré'
export const dateDePublication = '02/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ2PolynesieSpecifique2026 extends ExerciceQcmA {
  private expression(a: number, b: number): string {
    return `${rienSi1(a)}x${ecritureAlgebrique(b)}`
  }

  private appliquerLesValeurs(
    a: number,
    b: number,
    c: number,
    d: number,
  ): void {
    const correct = new FractionEtendue(d - b, a - c).simplifie()
    const distSigne = new FractionEtendue(b - d, a - c).simplifie()
    const distSoustraction = new FractionEtendue(d - b, a + c).simplifie()
    const distConstantes = new FractionEtendue(d + b, a - c).simplifie()

    this.enonce = `Dans l'ensemble des nombres réels, l'équation $${this.expression(a, b)}=${this.expression(c, d)}$ a pour solution :`

    this.reponses = [
      `$x=${correct.texFractionSimplifiee}$`,
      `$x=${distSigne.texFractionSimplifiee}$`,
      `$x=${distSoustraction.texFractionSimplifiee}$`,
      `$x=${distConstantes.texFractionSimplifiee}$`,
    ]

    this.correction = `$\\begin{aligned}
    ${this.expression(a, b)}&=${this.expression(c, d)}\\\\
    ${rienSi1(a - c)}x&=${d}${ecritureAlgebrique(-b)}\\\\
    ${rienSi1(a - c)}x&=${d - b}\\\\
    x&=${miseEnEvidence(correct.texFractionSimplifiee)}
    \\end{aligned}$`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(3, 2, -5, 4)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    const cas: [number, number, number, number][] = [
      [4, 1, -2, 5],
      [2, -3, -4, 6],
      [5, 2, -1, -4],
      [3, -2, -5, 1],
      [-2, 5, 4, -1],
    ]

    let compteur = 0
    do {
      const [a, b, c, d] = choice(cas)
      this.appliquerLesValeurs(a, b, c, d)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
