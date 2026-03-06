
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
import { choice } from '../../../lib/outils/arrayOutils'
import { rienSi1 } from '../../../lib/outils/ecritures'
export const titre = 'Factoriser une expression du type ax² ± x'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'j33nh'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can2a2026Q3 extends ExerciceCan {
   enonce(a?: number, signe?: string) {
    if (a == null || signe == null) {
      a = randint(2, 5)
      signe = choice(['+', '-'])
    }
this.optionsDeComparaison = { exclusifFactorisation: true }
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets
    
    if (signe === '-') {
      this.reponse = `x(${a}x-1)`
      this.question = `Factoriser $${rienSi1(a)}x^2-x$`
      this.correction = `$\\begin{aligned}${rienSi1(a)}x^2-x&=x\\times ${rienSi1(a)}x-x\\times 1\\\\
      &=${miseEnEvidence(`x(${rienSi1(a)}x-1)`)}\\end{aligned}$`
    } else {
      this.reponse = `x(${a}x+1)`
      this.question = `Factoriser $${rienSi1(a)}x^2+x$`
      this.correction = `$\\begin{aligned}${rienSi1(a)}x^2+x&=x\\times ${rienSi1(a)}x+x\\times 1\\\\
      &=${miseEnEvidence(`x(${rienSi1(a)}x+1)`)}\\end{aligned}$`
    }
    
    this.canEnonce = this.question
    this.canReponseACompleter = ''
    
    if (this.interactif) {
      this.question += '<br>'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(1, '-') : this.enonce()
  }
}