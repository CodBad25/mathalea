import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'bf899'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Factoriser ou développer une différence de deux carrés '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ1AGs2026 extends ExerciceQcmA {
  // Identité : a²x² - b² = (ax - b)(ax + b), avec b = p/q (fraction).
  private appliquerLesValeurs(
    sens: 'factorisation' | 'developpement',
    a: number,
    p: number,
    q: number,
  ): void {
    const b = new FractionEtendue(p, q)
    const bCarre = new FractionEtendue(p * p, q * q)
    const a2 = a * a

    const developpe = `${a2}x^2 - ${bCarre.texFractionSimplifiee}`
    const facteurMoins = `\\left(${a}x - ${b.texFraction}\\right)`
    const facteurPlus = `\\left(${a}x + ${b.texFraction}\\right)`
    const factorise = `${facteurMoins}${facteurPlus}`

    if (sens === 'factorisation') {
      this.enonce = `Une forme factorisée de l'expression $${developpe}$ est :`

      this.correction = `On reconnaît une différence de deux carrés : $${developpe} = (${a}x)^2 - \\left(${b.texFraction}\\right)^2$.<br>`
      this.correction += `On applique l'identité $a^2 - b^2 = (a-b)(a+b))$ avec $a = ${a}x$ et $b = ${b.texFraction}$ :<br>`
      this.correction += `$${developpe} = ${miseEnEvidence(factorise)}$.`

      this.reponses = [
        `$${factorise}$`,
        `$${facteurMoins}^2$`, // carré au lieu de conjugués
        `$\\left(${a2}x - ${b.texFraction}\\right)^2$`, // a² au lieu de a, et carré
        `$\\left(${a2}x - ${b.texFraction}\\right)\\left(${a2}x + ${b.texFraction}\\right)$`, // a² au lieu de a
      ]
    } else {
      this.enonce = `Une forme développée de l'expression $${factorise}$ est :`

      this.correction = `On applique l'identité $(a-b)(a+b) = a^2 - b^2$ avec $a = ${a}x$ et $b = ${b.texFraction}$ :<br>`
      this.correction += `$\\begin{aligned}
      ${factorise} &= (${a}x)^2 - \\left(${b.texFraction}\\right)^2\\\\
      & = ${miseEnEvidence(developpe)}
      \\end{aligned}$`

      this.reponses = [
        `$${developpe}$`,
        `$${a2}x^2 + ${bCarre.texFractionSimplifiee}$`, // erreur de signe
        `$${a2}x^2 - ${b.texFraction}$`, // oubli de mettre b au carré
        `$${a}x^2 - ${bCarre.texFractionSimplifiee}$`, // oubli de mettre a au carré
      ]
    }
  }

  versionOriginale: () => void = () => {
    // Sujet de l'image : 9x² - 1/9  =>  (3x - 1/3)(3x + 1/3)
    this.appliquerLesValeurs('factorisation', 3, 1, 3)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    const fractions: [number, number][] = [
      [1, 2], [1, 3], [2, 3], [1, 4], [3, 4],
      [1, 5], [2, 5], [3, 5], [4, 5],
    ]

    let compteur = 0
    do {
      const sens = choice(['factorisation', 'developpement']) as 'factorisation' | 'developpement'
      const a = choice([2, 3, 4, 5])
      const [p, q] = choice(fractions)
      this.appliquerLesValeurs(sens, a, p, q)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}