import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Déterminer le reste d\'une division euclidienne'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '422ef'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20264emeQ19 extends ExerciceCan {
 enonce(dividende?: number, diviseur?: number) {
    if (dividende == null || diviseur == null) {
      diviseur = randint(3, 5)
      const quotient = randint(15, 29)
      const reste = randint(1, diviseur - 1)
      dividende = quotient * diviseur + reste
    }
    
    const quotient = Math.floor(dividende / diviseur)
    const reste = dividende % diviseur
    
    this.question = `Le reste de la division euclidienne de $${dividende}$ par $${diviseur}$ est `
    
    this.correction = `Division euclidienne de $${dividende}$ par $${diviseur}$ :<br>
    $${dividende} = ${diviseur} \\times ${quotient} + ${reste}$<br>
    Le reste de la division euclidienne est $${miseEnEvidence(reste)}$.`
    
    this.canEnonce = this.question
    this.canReponseACompleter = '$\\ldots$'
    this.reponse = reste
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsChampTexte = { texteApres: '.' }
    if (!this.interactif) {
      this.question += ' $\\ldots$'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(519, 5) : this.enonce()
  }
}