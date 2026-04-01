
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
export const titre = 'Q30'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'n3qet'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can1a2022Q30 extends ExerciceCan {
   constructor() {
    super()
    this.formatInteractif = 'fillInTheBlank'
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  enonce(a?: number, b?: number, c?: number) {
    if (a == null || b == null || c == null) {
      a = randint(-10, 10, [0, 1])
      b = randint(-10, 10, [0, 1])
      c = randint(1, 10, [0, 1])
    }

    const reponse = a + b - c

    this.reponse = { champ1: { value: reponse } }

    this.question = `\\dfrac{\\mathrm{e}^{${a}}\\times \\mathrm{e}^{${b}}}{\\mathrm{e}^{${c}}} = \\mathrm{e}^{%{champ1}}`

    this.correction = `$\\dfrac{\\mathrm{e}^{${a}}\\times \\mathrm{e}^{${b}}}{\\mathrm{e}^{${c}}}=
\\dfrac{\\mathrm{e}^{${a}+${ecritureParentheseSiNegatif(b)}}}{\\mathrm{e}^{${c}}}=\\mathrm{e}^{${a + b}-${c}}=\\mathrm{e}^{${miseEnEvidence(reponse)}}$`

    this.canEnonce = `$\\dfrac{\\mathrm{e}^{${a}}\\times \\mathrm{e}^{${b}}}{\\mathrm{e}^{${c}}}$`
    this.canReponseACompleter = `$\\mathrm{e}^{\\ldots}$`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(-3, 8, 2) : this.enonce()
  }
}
