import { miseEnEvidence } from '../../../lib/outils/embellissements'
import ExerciceCan from '../../ExerciceCan'
import { randint } from '../../../modules/outils'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'

export const titre = 'Compléter une suite logique'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '8c3df'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can2026CE1Q11 extends ExerciceCan {
    enonce(a?: number, k?: number) {
    if (a == null || k == null) {
      a = randint(21, 29)
      k = randint(3, 6)
    }
    this.formatInteractif = 'fillInTheBlank'
    this.reponse = { champ1: { value: (a - 2 * k).toString() } }
    this.consigne = 'Complète cette suite logique.'
    this.question = `${a}~;~${a - k}~;~{%{champ1}}~;~${a - 3 * k}~;~${a - 4 * k}`
    this.correction = `On constate que l'on passe d'un nombre au suivant en retirant $${k}$.<br>
    Ainsi, le nombre cherché est donné par la différence : $${a - k}-${k}=${miseEnEvidence(a - 2 * k)}$.`
 this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = 'Complète cette suite logique.'
    this.canReponseACompleter = `$${a}~;~${a - k}~;~\\ldots~;~${a - 3 * k}~;~${a - 4 * k}$`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(25, 5) : this.enonce()
  }
}