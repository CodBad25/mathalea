import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { ecritureAlgebrique, reduireAxPlusB } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import FractionEtendue from '../../modules/FractionEtendue'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '09/09/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '202d9'

export const refs = {
  'fr-fr': ['1A-C10-11', '2A-C3-4'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation $ax+b=c$'
/**
 * @author Gilles Mora
 */
export default class Auto1AC11c extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsDeComparaison = { fractionIrreductible: true }
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    let a: number
    let b: number
    let c: number
    let compteur = 0
    // Signes de a, b et c (c est toujours négatif) ; on évite une solution entière.
    const cas = this.quotaChoice('cas', [1, 2, 3])
    do {
      a = randint(2, 9) * (cas === 1 ? 1 : -1)
      b = randint(2, 9) * (cas === 3 ? 1 : -1)
      c = randint(-15, -3)
      compteur++
    } while (compteur < 100 && (c - b) % a === 0)

    const fraction = (num: number, den: number) =>
      new FractionEtendue(num, den).simplifie().texFractionSimplifiee
    const solution = fraction(c - b, a)

    const brute = `\\dfrac{${c - b}}{${a}}`
    const conclusion =
      solution === brute
        ? `$x=${miseEnEvidence(solution)}$`
        : `$x=${brute}$, soit $x=${miseEnEvidence(solution)}$`

    this.question = `Résoudre l'équation $${reduireAxPlusB(a, b)}=${c}$.`
    this.correction = `On obtient $x$ en ${b < 0 ? `ajoutant $${-b}$ à` : `retranchant $${b}$ à`} $${c}$, puis en divisant le résultat par $${a}$.<br>
    Ainsi, $x=\\dfrac{${c}${ecritureAlgebrique(-b)}}{${a}}$, c'est-à-dire ${conclusion}.`

    if (this.versionQcm) {
      this.reponse = `$${solution}$`
      this.distracteurs = [
        fraction(c + b, a),
        fraction(b - c, a),
        fraction(a, c - b),
        fraction(c + b, -a),
        fraction(c - a, b),
      ].map((d) => `$${d}$`)
    } else {
      this.reponse = solution
      if (this.interactif) this.question += '<br>$x=$'
    }
  }
}
