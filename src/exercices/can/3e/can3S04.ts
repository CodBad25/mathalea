import { listeDeNotes } from '../../../lib/outils/aleatoires'
import { sp } from '../../../lib/outils/outilString'
import { prenom } from '../../../lib/outils/Personne'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer une étendue'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 * Date de publication
*/
export const uuid = 'f0983'

export const refs = {
  'fr-fr': ['can3S04'],
  'fr-ch': [],
}
export default class Etendue extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let min, max
    const nombreNotes = randint(4, 7)
    const notes = listeDeNotes(nombreNotes, randint(0, 7), randint(13, 20)) // on récupère une série de notes (série brute)
    min = 20
    max = 0
    for (let j = 0; j < nombreNotes; j++) {
      // On cherche la note minimum et la note maximum
      min = Math.min(notes[j], min)
      max = Math.max(notes[j], max)
    }
    this.question = `${prenom()} a obtenu ces notes ce trimestre-ci en mathématiques :<br>
    `
    this.question += `$${notes[0]}$
    `
    for (let j = 1; j < nombreNotes - 1; j++) {
      this.question += `${sp(2)} ; ${sp(2)} $${notes[j]}$ `
    } // On liste les notes
    this.question += `${sp(2)} et ${sp(2)} $${notes[nombreNotes - 1]}$.<br>
    `
    this.question += "Calculer l'étendue de cette série de notes."
    this.correction = `La note la plus basse est : $${min}$.<br>La note la plus haute est : $${max}$<br>`
    this.correction +=
      "Donc l'étendue de cette série est : " +
      `$${texNombre(max)}-${texNombre(min)}=${texNombre(max - min)}$`
    this.reponse = max - min
  }
}
