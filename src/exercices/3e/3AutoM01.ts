import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import Hms from '../../modules/Hms'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre = 'Convertir une durée donnée en minutes en heures'

export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '05/12/2025'

export const uuid = '4b987'

export const refs = {
  'fr-fr': ['3AutoM01'],
  'fr-ch': [],
}
/**
 * @author Jean-claude Lhote
 */
export default class ConvertirMinutesEnHeures extends ExerciceSimple {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = [
      'Sujet original (2e paramètre inutile si coché)',
      false,
    ]
    this.besoinFormulaire2CaseACocher = ['Heures entières', true]
    this.sup = false
    this.sup2 = false
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierHms
    this.optionsDeComparaison = { HMS: true }
  }

  nouvelleVersion() {
    const nbHeuresEntieres = this.sup ? 4 : randint(3, 8)
    const nombreDeMinutesEnPlus = this.sup2 || this.sup ? 0 : randint(1, 5) * 10
    const nombreTotalDeMinutes = nbHeuresEntieres * 60 + nombreDeMinutesEnPlus
    const evenement =
      this.sup || nombreTotalDeMinutes < 200
        ? 'film'
        : nombreTotalDeMinutes < 300
          ? 'show'
          : 'concours'
    const answer = new Hms({
      hour: nbHeuresEntieres,
      minute: nombreDeMinutesEnPlus,
    })
    this.reponse = answer
    this.question = `Un ${evenement} dure $${nombreTotalDeMinutes}$ minutes. Quelle est sa durée en heures ${nombreDeMinutesEnPlus > 0 ? 'et minutes' : ''} ?`
    this.correction = `Une heure contient 60 minutes. <br>
    ${
      nombreDeMinutesEnPlus === 0
      ? `Dans $${nombreTotalDeMinutes}$ minutes, il y a $${Math.floor(nombreTotalDeMinutes / 60)}\\times 60$ minutes, soit ${texteEnCouleurEtGras(answer.toString())}.`
        : `$${nombreTotalDeMinutes}=${nbHeuresEntieres * 60}+${nombreDeMinutesEnPlus}=${Math.floor(nombreTotalDeMinutes / 60)}\\times 60+${nombreDeMinutesEnPlus}$, donc dans $${nombreTotalDeMinutes}$ minutes il y a ${texteEnCouleurEtGras(answer.toString())}.`
    }`
  }
}
