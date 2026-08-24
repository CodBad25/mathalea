import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { bleuMathalea } from '../../../lib/colors'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

export const titre = 'Multiplier astucieusement par 25'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Rémi Angot
 * Multiplier par 25 revient à diviser par 4 puis multiplier par 100,
 * car 25 = 100 / 4.
 */
export const uuid = 'f335c'

export const refs = {
  'fr-fr': ['can5C39'],
  'fr-ch': [],
}

export default class MultiplierParVingtCinq extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  nouvelleVersion() {
    const quotient = this.quotaRandint('quotient', 2, 15)
    const n = quotient * 4
    this.reponse = quotient * 100

    this.question = `Calculer $${n} \\times 25$.`

    this.correction = `$${n} \\times 25 = ${n} \\div 4 \\times 100 = ${quotient} \\times 100 = ${miseEnEvidence(texNombre(this.reponse))}$`
    this.correction += texteEnCouleur(
      `<br> Mentalement : <br>
Multiplier par $25$ revient à diviser par $4$ puis multiplier par $100$, car $25 = \\dfrac{100}{4}$.<br>
Ici, $${n} \\div 4 = ${quotient}$, puis quand on multiplie par $100$, le chiffre des unités de $${quotient}$ devient le chiffre des centaines : on obtient $${texNombre(this.reponse)}$.
  `,
      bleuMathalea,
    )
  }
}
