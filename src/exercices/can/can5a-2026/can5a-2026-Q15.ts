import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence, texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import { formatMinute } from '../../../lib/outils/texNombre'
import Hms from '../../../modules/Hms'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Déteterminer une heure de départ en soustrayant une durée'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'zqf0m'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can52026Q15 extends ExerciceCan {
  enonce(hArrivee?: number, minArrivee?: number, duree?: number) {
    if (hArrivee == null || minArrivee == null || duree == null) {
      // Génération aléatoire
      duree = choice([25, 35, 45, 55]) // durées variées
      hArrivee = randint(8, 17) // heure d'arrivée entre 8h et 17h
      minArrivee = randint(1, 5) * 10 + 5 // minutes : 15, 25, 35, 45, 55
    }

    // Calcul de l'heure de départ en soustrayant la durée
    const totalMinutesArrivee = hArrivee * 60 + minArrivee
    const totalMinutesDepart = totalMinutesArrivee - duree
    const hDepart = Math.floor(totalMinutesDepart / 60)
    const minDepart = totalMinutesDepart % 60
 this.optionsDeComparaison = { HMS: true }
    this.reponse = new Hms({ hour: hDepart, minute: minDepart })
    this.formatChampTexte = KeyboardType.clavierHms
    
    const prenom = choice(['Zoé', 'Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Sarah', 'Laura', 'Marine', 'Lucie'])
    
    this.question = `${prenom} est arrivée au collège à $${hArrivee}$ h $${formatMinute(minArrivee)}$ min.<br>
Son trajet a duré $${duree}$ minutes.<br>
Elle est partie à `

    this.correction = `Pour trouver l'heure de départ, on soustrait la durée du trajet de l'heure d'arrivée.<br>
$${hArrivee}$ h $${formatMinute(minArrivee)}$ min $- ${duree}$ min $=$ $${hDepart}$ h $${formatMinute(minDepart)}$ min.<br>
${prenom} est partie à $${miseEnEvidence(hDepart)}$ ${texteEnCouleurEtGras('h')} $${miseEnEvidence(formatMinute(minDepart))}$ ${texteEnCouleurEtGras('min')}.`

    this.canEnonce = `${prenom} est arrivée au collège à $${hArrivee}$ h $${formatMinute(minArrivee)}$ min. Son trajet a duré $${duree}$ minutes. Elle est partie à :`
    this.canReponseACompleter = '$\\ldots$ h $\\ldots$ min'
      this.optionsChampTexte = { texteApres: '.' }
    if (!this.interactif) {
      this.question += ' $\\ldots$ h $\\ldots$ min'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(8, 45, 55) : this.enonce()
  }
}
