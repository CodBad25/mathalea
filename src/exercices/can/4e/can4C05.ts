import { choice } from '../../../lib/outils/arrayOutils'
import { simplificationDeFractionAvecEtapes } from '../../../lib/outils/deprecatedFractions'
import {
  fraction,
  obtenirListeFractionsIrreductibles,
} from '../../../modules/fractions'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Déterminer la somme de fractions à dénominateurs compatibles'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '1b4fe'

export const refs = {
  'fr-fr': ['can4C05'],
  'fr-ch': ['NR'],
}
export default class SommeFractionsCompatibles extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = choice(obtenirListeFractionsIrreductibles())
    const c = choice([2, 4])
    const b = fraction(1, a.d * c)
    if (choice([true, false])) {
      this.question = `Calculer $${a.texFraction} + ${b.texFraction}$.`
      this.correction = `Pour additionner des fractions, on les met au même dénominateur.<br>
     <br>
     Pour écrire $${a.texFraction}$ avec le même dénominateur que $${b.texFraction}$,
     on multiplie son numérateur et son dénominateur par $${c}$.<br><br>
     Ainsi, $${a.texFraction} + ${b.texFraction}
     =\\dfrac{${a.n}\\times ${c}}{${a.d}\\times ${c}}+ ${b.texFraction}
    =${a.reduire(c).texFraction} + ${b.texFraction}
    =\\dfrac{${a.n * c}+${b.n}}{${b.d}}
    =\\dfrac{${a.n * c + b.n}}{${b.d}}${simplificationDeFractionAvecEtapes(a.n * c + b.n, b.d)}$`
    } else {
      this.question = `Calculer $ ${b.texFraction}+${a.texFraction}$.`
      this.correction = `Pour additionner des fractions, on les met au même dénominateur.<br>
     <br>
     Pour écrire $${a.texFraction}$ avec le même dénominateur que $${b.texFraction}$,
     on multiplie son numérateur et son dénominateur par $${c}$.<br><br>
     Ainsi, $ ${b.texFraction}+${a.texFraction}
     = ${b.texFraction}+\\dfrac{${a.n}\\times ${c}}{${a.d}\\times ${c}}
    =${b.texFraction}+${a.reduire(c).texFraction}
    =\\dfrac{${b.n}+${a.n * c}}{${b.d}}
    =\\dfrac{${b.n + a.n * c}}{${b.d}}${simplificationDeFractionAvecEtapes(a.n * c + b.n, b.d)}$`
    }

    this.reponse = a.sommeFraction(b).simplifie()
  }
}
