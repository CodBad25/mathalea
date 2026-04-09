import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Tables de multiplication'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'a343g'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-claude Lhote

*/
export default class Can2025N5Q1 extends ExerciceCan {
  enonce(a?: number, b?: number) {
    if (a == null || b == null) {
      a = choice([6, 7, 8, 9])
      b = choice([6, 7, 8, 9], [a])
    }
    this.reponse = a * b
    this.question = `$${a} \\times ${b}$ `
    this.correction = `$${a}\\times${b}=${miseEnEvidence(texNombre(this.reponse, 0))}$`

    if (this.interactif) {
      this.question += '$=$'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(6, 7) : this.enonce()
  }
}
