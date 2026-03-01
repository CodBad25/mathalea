import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Calculer 10, 20 ou 30  $\\%$ d\'un nombre'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'ttsnc'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can32026Q10 extends ExerciceCan {
  enonce(a?: number,b?: number) {
    
      if (b == null|| a == null) {
        a = choice([10,20,30])
        b =
          randint(2, 9) * 10 
      }
      this.formatChampTexte = KeyboardType.clavierDeBase
      this.reponse = (a * b) / 100
      this.question = `$${a}\\,\\%$ de $${b}$`
      this.correction = `$10\\,\\%$ de $${b}$ est égal à $${texNombre(b)}\\div 10 = ${a===10 ? `${miseEnEvidence(texNombre(b/10, 0))}`: `${texNombre(b/10, 0)}`}$.
      ${a===10 ? ``: `<br>
      Donc $${a}\\,\\%$ de $${b}$ est égal à $${texNombre(a/10,0)}\\times ${texNombre(b/10, 0)}=${miseEnEvidence(texNombre((a * b) / 100, 2))}$.`}`
      this.canEnonce = this.question
      if (this.interactif) {
        this.question += ' est égal à '
      }
      this.optionsChampTexte = { texteApres: '.' }
    }
  
    nouvelleVersion() {
      this.canOfficielle ? this.enonce(20,50) : this.enonce()
    }
  }
  