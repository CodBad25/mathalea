import ExerciceSimple from '../../ExerciceSimple'

import { miseEnEvidence } from '../../../lib/outils/embellissements'

import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
export const titre = "Calculer avec un coefficient d\'agrandissement/réduction"
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '09/12/2025'
/**
 * @author Gilles Mora

 * 
*/
export const uuid = '02ad1'

export const refs = {
  'fr-fr': ['can4G16'],
  'fr-ch': [],
}
export default class QuestionsAiresEtPerimetres5 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
  }

  nouvelleVersion() {
    const a = 0
    const N = choice(['a', 'b', 'c'])
    if (N === 'a') {
      const a = randint(2, 7) // aire
      const c = randint(2, 4) // coefficient
      this.question = `Les longueurs d'un rectangle de $${a}\\text{ cm}^2$  sont multipliées par $${c}$.<br>
          Quelle est l'aire du rectangle ainsi obtenu ?`
      this.optionsChampTexte = {
        texteAvant: '<br>',
        texteApres: '$\\text{cm}^2$',
      }
      this.correction = ` Si les longueurs sont multiplées par $k$, les aires sont multipliées par $k^2$, soit ici par $${c}^2=${c ** 2}$.<br>
          Ainsi, l'aire du nouveau rectangle est : $${a}\\times ${c * c}=${miseEnEvidence(a * c * c)}\\text{ cm}^2$.
      <br>`

      this.reponse = a * c * c

      this.canReponseACompleter = '$\\ldots\\text{ cm}^2$'
      this.listeCanEnonces.push(this.canEnonce)
      this.listeCanReponsesACompleter.push(this.canReponseACompleter)
    } else if (N === 'b') {
      const n = randint(1, 3)
      const d = randint(n + 1, 10)
      const maFraction = new FractionEtendue(n, d).simplifie()
      this.reponse = maFraction.puissanceFraction(2).texFSD
      this.question = `Les longueurs d'un triangle sont multipliées par $${maFraction.texFraction}$.<br>
          Par combien est multipliée son aire  ?  `
      this.optionsChampTexte = { texteAvant: '<br>' }
      this.correction = ` Si les longueurs sont multiplées par $k$, les aires sont multipliées par $k^2$.<br>
          Ainsi, l'aire a été multipliée par : $\\left(${maFraction.texFraction}\\right)^2=${miseEnEvidence(this.reponse)}$.
      <br>`

      this.listeCanEnonces.push(this.canEnonce)
      this.listeCanReponsesACompleter.push(this.canReponseACompleter)
    } else {
      // N === 'c'
      const n = randint(1, 3)
      const d = randint(n + 1, 10)
      const maFraction = new FractionEtendue(n, d).simplifie()
      const maFractionAuCarre = maFraction.puissanceFraction(2).texFraction
      this.reponse = maFraction.texFSD
      this.question = `L'aire d'un parallélogramme a été multipliée par $${maFractionAuCarre}$.<br>
          Par combien ont été multipliées les longueurs de ses côtés ?
          `
      this.optionsChampTexte = { texteAvant: '<br>' }
      this.correction = ` Si les aires sont multiplées par $k$, les longueurs sont multipliées par $\\sqrt{k}$.<br>
          Ainsi, les longueurs ont été multipliées par : $\\sqrt{${maFractionAuCarre}}=${miseEnEvidence(this.reponse)}$.
      <br>`

      this.listeCanEnonces.push(this.canEnonce)
      this.listeCanReponsesACompleter.push(this.canReponseACompleter)
    }
  }
}
