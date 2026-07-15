import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Connaitre les tables de multiplication (phrases)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '24/01/2023'

/**
 * @author Gilles Mora
 *
 */

export const uuid = 'aa8af'

export const refs = {
  'fr-fr': ['canc3C15', 'auto5N1C-flash1'],
  'fr-ch': [],
}
export default class TablesPhrase extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  nouvelleVersion() {
    const a = randint(3, 9)
    const b = randint(3, 9)
    const c = a * b
    this.reponse = b
    this.question = `Dans $${c}$, combien de fois $${a}$ ?`
    this.correction = `Dans $${c}$, il y a $${miseEnEvidence(b)}$ fois $${a}$ car $${a}\\times ${b}=${c}$.`
  }
}
