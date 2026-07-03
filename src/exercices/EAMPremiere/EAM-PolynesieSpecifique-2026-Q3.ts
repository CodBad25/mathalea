import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'psq03'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Développer une identité remarquable'
export const dateDePublication = '02/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ3PolynesieSpecifique2026 extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, b: number): void {
    const facteurMoins = `(${a}x${ecritureAlgebrique(-b)})`
    const facteurPlus = `(${a}x${ecritureAlgebrique(b)})`
    const correct = `${a * a}x^2-${b * b}`
    const dist1 = `${a}x^2-${b * b}`
    const dist2 = `${a}x^2-${a * b}`
    const dist3 = `${a * a}x^2${ecritureAlgebrique(-2 * a * b)}x+${b * b}`

    this.enonce = `Pour tout nombre réel $x$, $${facteurMoins}${facteurPlus}$ est égal à :`

    this.reponses = [`$${correct}$`, `$${dist1}$`, `$${dist2}$`, `$${dist3}$`]

    this.correction = `On sait que pour tous réels $a$ et $b$, $(a-b)(a+b)=a^2-b^2$.<br>
    $\\begin{aligned}
    ${facteurMoins}${facteurPlus}&=(${a}x)^2-${b}^2\\\\
    &=${a * a}x^2-${b * b}\\\\
    &=${miseEnEvidence(correct)}
    \\end{aligned}$`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2, 3)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const a = choice([2, 3, 4, 5])
      const b = choice([1, 2, 3, 4, 5], [a])
      this.appliquerLesValeurs(a, b)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
