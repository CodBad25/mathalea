import { miseEnEvidence } from '../../../lib/outils/embellissements'
import ExerciceCan from '../../ExerciceCan'
import { randint } from '../../../modules/outils'
import { texNombre } from '../../../lib/outils/texNombre'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'

export const titre = 'Calculer une somme'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '28cfe'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can2026CE2Q2 extends ExerciceCan {
 enonce(somme?: number, terme2?: number) {
    if (somme == null || terme2 == null) {
      somme = randint(10, 20) * 10 // Multiple de 10 entre 100 et 200
      terme2 = somme - randint(1, 9) // Le terme2 est juste en dessous du multiple de 10
    }

    this.reponse = somme - terme2
    this.question = `Complète.<br>`
    this.correction = `$${miseEnEvidence(texNombre(this.reponse, 0))}+${terme2}=${somme}$`
    this.canEnonce = 'Complète.'
    this.canReponseACompleter = `$\\ldots +${terme2}=${somme}$`

    if (this.interactif) {
      this.optionsChampTexte = { texteAvant: '', texteApres: `$+${terme2}=${somme}$` }
    } else {
      this.question += `$\\ldots +${terme2}=${somme}$`
    }
    this.formatChampTexte = KeyboardType.clavierDeBase
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(140, 134) : this.enonce()
  }
}