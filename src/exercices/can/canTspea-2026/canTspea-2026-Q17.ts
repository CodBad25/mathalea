import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { ecritureAlgebrique } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre = 'Résoudre une équation du type $e^(x+a) = 1$'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '8u8my'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/ export default class Can2026TermQ17 extends ExerciceCan {
  enonce(a?: number): void {
    if (a == null) {
      a = randint(-9, 9, 0)
    }

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = String(-a)

    this.question = `$\\text{e}^{x${ecritureAlgebrique(a)}}=1$<br>`
    if (this.interactif) {
      this.question += '$x=$'
    } else {
      this.question += '$x=\\ldots$'
    }

    this.correction = `$\\text{e}^{x${ecritureAlgebrique(a)}}=1$<br>
    $\\text{e}^{x${ecritureAlgebrique(a)}}=\\text{e}^0$<br>
     $x${ecritureAlgebrique(a)}=0$, soit $x=${miseEnEvidence(String(-a))}$.`

    this.canEnonce = `$\\text{e}^{x${ecritureAlgebrique(a)}}=1$`
    this.canReponseACompleter = '$x=\\ldots$'
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(3) : this.enonce()
  }
}
