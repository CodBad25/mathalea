import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

export const titre = 'Calculer une différence de deux entiers'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'd63e8'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class NomExercice extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBase

    this.canOfficielle = false
  }

  nouvelleVersion() {
    if (this.canOfficielle) {
      this.reponse = 18
      this.question = '$47-29$ '
      this.correction = `$47-29=${miseEnEvidence(18)}$`
    } else {
      const a = randint(41, 88, [49, 59, 69, 79])
      const b = choice([19, 29])
      this.reponse = a - b
      this.question = `$${a}-${b}$ `
      this.correction = `$${a}-${b}=${a}-${b + 1}+1=${a - b}$`
    }

    if (this.interactif) {
      this.question += ' $=$'
    }
  }
}
