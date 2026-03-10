import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import FractionEtendue from '../../../modules/FractionEtendue'
import { obtenirListeFractionsIrreductibles } from '../../../modules/fractions'
import ExerciceSimple from '../../ExerciceSimple'

export const titre = 'Calculer la fraction d’entier'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = 'e4b95'

export const refs = {
  'fr-fr': ['can5C12'],
  'fr-ch': [],
}
export default class FractionDEntierQuiVaBien extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.optionsDeComparaison = { fractionSimplifiee: true }
  }

  nouvelleVersion() {
    const a = choice(obtenirListeFractionsIrreductibles())
    const c = choice([2, 3, 4, 5, 6])
    const b = a.d * c
    this.reponse = new FractionEtendue(a.n * c, 1)
    this.question = `Calculer $${a.texFraction}\\times ${b}$ sous la forme d'un entier.`
    if (a.n === 1) {
      this.correction = `$${a.texFraction}\\times ${b}=${a.n * c}$<br><br>`
      this.correction += `${texteEnCouleur('Mentalement :')}<br>`
      this.correction += `${texteEnCouleur('Pour multiplier $' + b + '$ par $' + a.texFraction + '$, on divise $' + b + '$ par $' + a.d + '$ : on obtient $\\dfrac{' + b + '}{' + a.d + '}=' + b / a.d + '$.')}<br>`
      this.correction += `${texteEnCouleur('Ainsi $' + a.texFraction + '\\times ' + b + ' = \\dfrac{' + b + '}{' + a.d + '}=' + a.n * c + '$.<br>')}`
    } else {
      this.correction = `$${a.texFraction}\\times ${b}=${a.n * c}$<br><br>`
      this.correction += `${texteEnCouleur('Mentalement :')}<br>`
      this.correction += `${texteEnCouleur('Pour multiplier $' + b + '$ par $' + a.texFraction + '$, on commence par diviser  $' + b + '$ par $' + a.d + '$ (car la division "tombe juste") : on obtient $\\dfrac{' + b + '}{' + a.d + '}=' + b / a.d + '$.')}<br>`
      this.correction += `${texteEnCouleur('Puis, on multiplie ce résultat par $' + a.n + '$, ce qui donne : $' + a.n + '\\times ' + b / a.d + '=' + a.n * c + '$.<br>')}`
    }
  }
}
