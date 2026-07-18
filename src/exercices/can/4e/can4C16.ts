import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import FractionEtendue from '../../../modules/FractionEtendue'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Multiplier des fractions'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '07/09/2023'

/**
 * @author Gilles Mora

 */

export const uuid = '07df0'

export const refs = {
  'fr-fr': ['can4C16'],
  'fr-ch': ['NR'],
}
export default class MultiplierFraction extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsChampTexte = { texteAvant: '<br>' }
    this.optionsDeComparaison = { fractionIrreductible: true }
  }

  nouvelleVersion() {
    const listeFractions1 = [
      [1, 3],
      [1, 5],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 5],
      [1, 6],
      [5, 6],
      [1, 7],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
      [1, 8],
      [3, 8],
      [1, 9],
      [2, 9],
      [4, 9],
      [5, 9],
      [7, 9],
      [3, 4],
      [5, 3],
      [5, 3],
      [5, 4],
      [10, 3],
      [3, 10],
    ]
    const listeFractions2 = [
      [1, 3],
      [1, 5],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 5],
      [1, 6],
      [5, 6],
      [1, 7],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
      [1, 8],
      [3, 8],
      [5, 8],
      [7, 8],
      [1, 9],
      [2, 9],
      [4, 9],
      [5, 9],
      [7, 9],
      [9, 8],
      [10, 7],
      [10, 9],
      [7, 10],
    ]
    const fraction1 = this.quotaChoice('fraction1', listeFractions1)
    const fraction2 = this.quotaChoice('fraction2', listeFractions2)
    const n1 = fraction1[0]
    const d1 = fraction1[1]
    const n2 = fraction2[0]
    const d2 = fraction2[1]
    const f1 = new FractionEtendue(n1, d1)
    const f2 = new FractionEtendue(n2, d2)
    this.reponse = f1.produitFraction(f2).simplifie()
    this.question = `Calculer et écrire sous la forme d'une fraction simplifiée : $${f1.texFraction}\\times ${f2.texFraction}$.<br>`
    this.correction = `$${f1.texProduitFraction(f2, false)}$`
  }
}
