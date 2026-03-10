import { bleuMathalea } from '../../../lib/colors'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'

import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Soustraire $10n + 9$'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021
 */
export const uuid = '592c7'

export const refs = {
  'fr-fr': ['can6C09', 'CM2N3J-flash2'],
  'fr-ch': [],
}
export default class SoustraireX9 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  nouvelleVersion() {
    const a = randint(5, 9)
    const b = randint(1, 8)
    const c = randint(1, 4)
    this.reponse = a * 10 + b - c * 10 - 9
    this.question = `Calculer $${a * 10 + b} - ${c * 10 + 9}$.`
    this.correction = `$${a * 10 + b} - ${c * 10 + 9}= ${this.reponse}$<br>`
    this.correction += texteEnCouleur(
      `<br> Mentalement : <br>
    Soustraire $${c * 10 + 9}$ revient à soustraire $${c * 10 + 10}$, puis à ajouter $1$.<br>
    Ainsi, $${a * 10 + b} - ${c * 10 + 9}=${a * 10 + b} - ${c * 10 + 10}+1=${a * 10 + b - c * 10 - 10}+1=${this.reponse}$.
       `,
      bleuMathalea,
    )
  }
}
