import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import ExerciceCan from '../../ExerciceCan'

export const titre = "Déterminer les facteurs d'un carré parfait"
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '0c7bb'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20266Q1 extends ExerciceCan {
  enonce(n?: number) {
    let carre: number

    if (n == null) {
      carre = choice([16, 25, 49, 64, 81])
    } else {
      carre = n
    }

    const racine = Math.sqrt(carre)

    this.consigne = 'Complète.'
    this.question = `${carre}=%{champ1}\\times%{champ2}`

    this.reponse = {
      champ1: { value: racine },
      champ2: { value: racine },
    }

    this.correction = `$${carre}=${miseEnEvidence(racine)}\\times${miseEnEvidence(racine)}$`

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = 'Complète.'
    this.canReponseACompleter = `$${carre}=\\ldots\\times\\ldots$`
  }

  nouvelleVersion() {
    this.formatInteractif = 'fillInTheBlank'
    this.canOfficielle ? this.enonce(36) : this.enonce()
  }
}
