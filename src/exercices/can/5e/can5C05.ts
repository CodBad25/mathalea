import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer un quotient entier'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '63dff'

export const refs = {
  'fr-fr': ['can5C05'],
  'fr-ch': [],
}
export default class Division5e extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = randint(11, 15)
    const b = randint(3, 6)
    const c = a * b
    this.reponse = a
    this.question = `Calculer $${c} \\div ${b}$.`
    this.correction = `$${c} \\div ${b}=${a}$`
    this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    On décompose $${c}$ en $${b * 10}+${c - 10 * b}=${b}\\times 10+${b}\\times ${(c - 10 * b) / b}=${b}(10+${(c - 10 * b) / b})$.<br>
        Ainsi :
     $${c} \\div ${b}=10+${(c - 10 * b) / b}=${a}$.<br>
     `)
  }
}
