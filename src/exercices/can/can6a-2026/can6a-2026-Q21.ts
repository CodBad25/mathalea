import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Q21'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'o93lm'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

export let aQ21 = 4
export let bQ21 = 15

/**
 * @author Jean-Claude Lhote

*/
export default class Can20266Q21 extends ExerciceCan {
  enonce(a?: number, b?: number) {
    if (a == null || b == null) {
      a = choice([2, 4, 8])
      b = choice([15, 25, 35])
    }

    aQ21 = a
    bQ21 = b

    this.reponse = (a * b).toString()
if (this.interactif) {
     this.question = `$${a}\\times${b}=$`
    } else {
      this.question = `$${a}\\times${b}=\\ldots$`
    }
    

    this.correction = `$${a}\\times${b} =${miseEnEvidence(texNombre(a * b, 0))}$`

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = ''
    this.canReponseACompleter = ''
  }

  nouvelleVersion() {
    this.canOfficielle || this.sup ? this.enonce(4, 15) : this.enonce()
  }
}
