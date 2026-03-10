import { bleuMathalea } from '../../../lib/colors'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

export const titre = 'Ajouter $10n + 9$'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021
 */
export const uuid = '5b591'

export const refs = {
  'fr-fr': ['can6C04', 'CM2N3J-flash1'],
  'fr-ch': [],
}

export default class Ajoute10NPlus9 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  nouvelleVersion() {
    const a = randint(3, 9)
    const b = randint(2, 8)
    const c = randint(1, 5)
    this.reponse = a * 10 + b + c * 10 + 9
    this.question = `Calculer $${texNombre(a * 10 + b, 0)} + ${texNombre(c * 10 + 9, 0)}$.`

    // `${this.question} \\dots \\dots`
    this.correction = `$${texNombre(a * 10 + b, 0)} + ${texNombre(c * 10 + 9, 0)}= ${miseEnEvidence(texNombre(this.reponse, 0))}$<br>`
    this.correction += texteEnCouleur(
      `<br> Mentalement : <br>
   Pour ajouter $${c * 10 + 9}$, on peut ajouter $${(c + 1) * 10}$ et on retranche $1$.<br>
   Ainsi,  $${texNombre(a * 10 + b, 0)} + ${texNombre(c * 10 + 9, 0)}=(${texNombre(a * 10 + b, 0)}+${texNombre((c + 1) * 10, 0)}) - 1 =${texNombre(a * 10 + b + (c + 1) * 10, 0)} - 1=${texNombre(this.reponse, 0)}$.
    `,
      bleuMathalea,
    )
  }
}
