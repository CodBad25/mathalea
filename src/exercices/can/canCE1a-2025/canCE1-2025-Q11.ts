import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre = 'Trouver un nombre dans une suite'
export const interactifReady = true

export const uuid = 'e5ec7'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can2025CE1Q11 extends ExerciceCan {
  enonce(a?: number, k?: number) {
    if (a == null || k == null) {
      a = randint(3, 7)
      k = randint(2, 6)
    }
    this.formatInteractif = 'fillInTheBlank'
    this.reponse = { champ1: { value: (a + 2 * k).toString() } }
    this.consigne = 'Complète cette suite logique.'
    this.question = `${a}~;~${a + k}~;~{%{champ1}}~;~${a + 3 * k}~;~${a + 4 * k}`
    this.correction = `On constate que l'on passe d'un nombre au suivant en ajoutant $${k}$.<br>
    Ainsi, le nombre cherché est donné par la somme : $${a + k}+${k}=${miseEnEvidence(a + 2 * k)}$.`

    this.canEnonce = 'Complète cette suite logique.'
    this.canReponseACompleter = `${a}~;~${a + k}~;~\\ldots~;~${a + 3 * k}~;~${a + 4 * k}`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(5, 3) : this.enonce()
  }
}
