import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Calculer une probabilité'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '02d8w'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20264emeQ23 extends ExerciceCan {
  constructor() {
    super()
    this.formatInteractif = 'fillInTheBlank'
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  enonce(rouges?: number, vertes?: number, noires?: number) {
    let r: number, v: number, n: number

    if (rouges == null || vertes == null || noires == null) {
      r = randint(8, 12)
      v = randint(5, 9)
      n = randint(2, 4)
    } else {
      r = rouges
      v = vertes
      n = noires
    }

    const total = r + v + n
    const proba = new FractionEtendue(n, total)

    this.consigne = `Une urne contient ${r} boules rouges, ${v} boules vertes et ${n} boules noires.`
    this.question = `\\text{La probabilité de tirer une boule noire est }\\dfrac{%{champ1}}{%{champ2}}.`

    this.reponse = {
      champ1: { value: proba.num },
      champ2: { value: proba.den },
    }

    this.correction = `Le nombre total de boules est : $${r}+${v}+${n}=${total}$.<br>
    La probabilité de tirer une boule noire est : 
    $P(\\text{noire})=\\dfrac{\\text{nombre de boules noires}}{\\text{nombre total de boules}}
    ${proba.texFractionSimplifiee !== proba.texFraction ? `=` : `=\\dfrac{${miseEnEvidence(n)}}{${miseEnEvidence(total)}}`}
    ${proba.texFractionSimplifiee !== proba.texFraction ? `\\dfrac{${n}}{${total}}=` + miseEnEvidence(proba.texFractionSimplifiee) : ''}$.`

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = `Une urne contient ${r} boules rouges, ${v} boules vertes et ${n} boules noires.<br>La probabilité de tirer une boule noire est :`
    this.canReponseACompleter = '$\\dfrac{\\ldots}{\\ldots}$'
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(10, 7, 2) : this.enonce()
  }
}
