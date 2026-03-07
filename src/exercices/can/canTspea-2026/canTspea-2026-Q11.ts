
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
import { choice } from '../../../lib/outils/arrayOutils'
import { toutPourUnPoint } from '../../../lib/interactif/mathLive'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
export const titre = 'Completer un encadrement à partir d\'un encadrement'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'gc360'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/export default class Can2026TermQ12 extends ExerciceCan {
   constructor() {
    super()
     this.formatInteractif = 'fillInTheBlank'
   this.optionsDeComparaison = { nombreDecimalSeulement: true }
    this.formatChampTexte = KeyboardType.clavierDeBase
  }

 enonce(a?: number, b?: number, c?: number): void {
    if (a == null || b == null || c == null) {
      b = randint(-4, 4)
      c = b + randint(2, 6)
      a = randint(1, 8) * choice([-1, 1])
    }

    // Si b ≤ x ≤ c alors -c ≤ -x ≤ -b donc a-c ≤ a-x ≤ a-b
    const borneInf = a - c
    const borneSup = a - b

   
    this.reponse = {
       bareme: toutPourUnPoint,
      champ1: { value: String(borneInf) },
      champ2: { value: String(borneSup) },
    }
     
 this.formatChampTexte = KeyboardType.clavierDeBase
    this.consigne = `Si $${b}\\leqslant x\\leqslant ${c}$ alors :<br>`
    this.question = `%{champ1}~\\leqslant ${a}-x\\leqslant ~%{champ2}`

    this.correction = `$${b}\\leqslant x\\leqslant ${c}$<br>
     On multiplie par $-1$ (on inverse les inégalités) :<br>
    $${-c}\\leqslant -x\\leqslant ${-b}$<br>
   On ajoute $${a}$ :<br>
    $${miseEnEvidence(String(borneInf))}\\leqslant ${a}-x\\leqslant ${miseEnEvidence(String(borneSup))}$`

    this.canEnonce = `Si $${b}\\leqslant x\\leqslant ${c}$ alors :`
    this.canReponseACompleter = `$\\ldots\\leqslant ${a}-x\\leqslant \\ldots$`
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(3, -1, 5) : this.enonce()
  }
}
