import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Trouver le nombre dans une table de multiplication '
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
*/
export const uuid = 'bdb11'

export const refs = {
  'fr-fr': ['canc3C03'],
  'fr-ch': [],
}
export default class TableMultiplicationTrous extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  nouvelleVersion() {
    const a = this.quotaRandint('a', 2, 9)
    const b = this.quotaRandint('b', 4, 10)
    const c = a * b
    if (this.quotaChoice('ordre', [true, false])) {
      this.question = `Compléter : <br>$${a}\\times .... =${c}$`
      this.correction = `$${a}\\times ${miseEnEvidence(b)} =${c}$`
      this.canEnonce = 'Compléter.'
      this.canReponseACompleter = `$${a}\\times .... =${c}$`
    } else {
      this.question = `Compléter :<br> $ .... \\times ${a}=${c}$`
      this.correction = `$ ${miseEnEvidence(b)} \\times ${a}=${c}$`
      this.canEnonce = 'Compléter.'
      this.canReponseACompleter = `$ .... \\times ${a}=${c}$`
    }
    this.reponse = b
  }
}
