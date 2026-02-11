import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { formatMinute } from '../../../lib/outils/texNombre'
import Hms from '../../../modules/Hms'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Transformer un nombre de secondes en minutes et secondes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'p3stx'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20264emeQ21 extends ExerciceCan {
   enonce(totalSecondes?: number) {
    if (totalSecondes == null) {
      const min = randint(1, 9)
      const sec = randint(1, 59)
      totalSecondes = min * 60 + sec
    }

    // Calcul des minutes et secondes
    const minutes = Math.floor(totalSecondes / 60)
    const secondes = totalSecondes % 60

    this.optionsDeComparaison = { HMS: true }
    this.reponse = new Hms({ minute: minutes, second: secondes })
    this.formatChampTexte = KeyboardType.clavierHms
    
    this.question = `$${totalSecondes}$ secondes`

    this.correction = `$${totalSecondes}$ secondes $= ${minutes} \\times 60 + ${secondes}$<br>
Donc : $${totalSecondes}$ s $= ${miseEnEvidence(minutes)}$ min $${miseEnEvidence(formatMinute(secondes))}$ s.`

    this.canEnonce = this.question
    this.canReponseACompleter = '$\\ldots$ min $\\ldots$ s'
    
    if (this.interactif) {
      this.question = `Convertir $${totalSecondes}$ secondes en minutes/secondes.<br>`
    } else {
      this.question += ' $=\\ldots$ min $\\ldots$ s'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(137) : this.enonce()
  }
}