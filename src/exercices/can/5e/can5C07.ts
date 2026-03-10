import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Utiliser une priorité opératoire'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '14b41'

export const refs = {
  'fr-fr': ['can5C07'],
  'fr-ch': ['NR'],
}
export default class PrioriteOperatoire5e extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = randint(5, 9)
    const b = 20 - a
    const c = randint(3, 9)
    this.reponse = b + a * c
    this.question = `Calculer $${b} + ${a} \\times ${c}$.`
    this.correction = `$${b} + ${a} \\times ${c}= ${b} + ${a * c} = ${this.reponse}$`
    this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    La multiplication étant prioritaire sur l'addition, on commence par calculer $${a} \\times ${c}=${a * c}$.<br>
    On ajoute ensuite  $${b}$ pour obtenir le résultat : $${a * c}+${b}=${this.reponse}$.
     `)
  }
}
