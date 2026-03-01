import Decimal from 'decimal.js'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre = 'Déterminer un taux de hausse'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'em747'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can2a2026Q18 extends ExerciceCan {
  enonce(taux?: Decimal) {
    if (taux == null) {
      taux = new Decimal(randint(11, 99, [20, 30, 40, 50, 60, 70, 80, 90])).div(
        1000,
      )
     
    }
 const Taux = taux.mul(100)
      const coeff = taux.add(1)
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = new Decimal(taux).mul(100)
    this.question = `Multiplier un nombre par $${texNombre(coeff, 3)}$ revient à <br>effectuer une hausse de `
    this.correction = `Comme $${texNombre(coeff, 3)}=1+${texNombre(taux, 3)}=1+\\dfrac{${Taux}}{100}$, multiplier par $${texNombre(coeff, 3)}$ revient à effectuer une hausse de $${miseEnEvidence(texNombre(Taux, 2))}\\,\\%$. `
   this.optionsChampTexte = { texteApres: '$\\%$.' }
        if (!this.interactif) {
          this.question += '$\\ldots\\,\\%$'
        }
    this.canEnonce = this.question
    this.canReponseACompleter = '$\\ldots\\,\\%$'
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(new Decimal(0.026)) : this.enonce()
  }
}
