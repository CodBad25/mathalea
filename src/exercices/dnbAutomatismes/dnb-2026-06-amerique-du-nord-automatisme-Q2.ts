import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceCan from '../ExerciceCan'

export const uuid = 'c2a4b'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre = 'Appliquer une réduction en pourcentage'
export const dateDePublication = '06/06/2026'

/**
 * DNB Amérique du Nord juin 2026 - Question 2
 * @author Rémi Angot
 */
export default class AutoQ2ANbrevet2026 extends ExerciceCan {
  constructor() {
    super()
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
    this.optionsChampTexte = { texteApres: ' €' }
  }

  enonce(prix?: number, pourcentage?: number) {
    if (prix == null || pourcentage == null) {
      prix = choice([40, 45, 50, 60, 80, 120, 150])
      pourcentage = choice([10, 20, 25, 5])
    }
    const reduction = (prix * pourcentage) / 100
    const prixFinal = prix - reduction

    this.reponse = prixFinal
    this.question = `Un article coûte $${texNombre(prix)}$ €. Quel sera son prix après une réduction de $${pourcentage}\\,\\%$ ?`
    if (this.interactif) this.question += '<br>'

    this.correction = `La réduction est de $${texNombre(prix)}\\times ${texNombre(pourcentage / 100)}=${texNombre(reduction)}$ €.<br>
Le prix après réduction est donc :<br>
$${texNombre(prix)}-${texNombre(reduction)}=${miseEnEvidence(`${texNombre(prixFinal)}`)}$ €.`
  }

  nouvelleVersion() {
    // 45 € − 10 % → 40,5 €
    if (this.canOfficielle) {
      this.enonce(45, 10)
    } else {
      this.enonce()
    }
  }
}
