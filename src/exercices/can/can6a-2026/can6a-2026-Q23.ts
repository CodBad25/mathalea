import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Q23'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'htbe7'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote
 */
export default class Can20266Q23 extends ExerciceCan {
  constructor() {
    super()
    this.formatInteractif = 'fillInTheBlank'
  }

  enonce(minutes?: number, secondes?: number) {
    if (secondes == null || minutes == null) {
      minutes = randint(1, 5)
      secondes = randint(0, 5) * 10
    }
    if (context.isHtml) {
      this.consigne = 'Complète.'
      this.question = `${minutes}\\text{ min et }${secondes}\\text{ s} = %{champ1} \\text{ s}`
    } else {
      this.question = `Complète.<br>
  $${minutes}\\text{ min et }${secondes}\\text{ s} = \\ldots \\text{ s}$`
    }

    this.reponse = { champ1: { value: (minutes * 60 + secondes).toString() } }

    this.correction = `$${minutes}\\text{ min et }${secondes}\\text{ s} = ${minutes}\\times 60\\text{ s}+${secondes}\\text{ s} = ${miseEnEvidence(texNombre(minutes * 60 + secondes, 0))} \\text{ s}$`

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = 'Complète.'
    this.canReponseACompleter = `$${minutes}\\text{ min et }${secondes}\\text{ s} = \\ldots \\text{ s}$`
  }

  nouvelleVersion() {
    this.canOfficielle || this.sup ? this.enonce(2, 10) : this.enonce()
  }
}
