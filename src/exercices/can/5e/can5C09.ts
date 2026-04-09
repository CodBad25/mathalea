import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Multiplier par les multiples de 101'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '1a593'

export const refs = {
  'fr-fr': ['can5C09'],
  'fr-ch': ['NR'],
}
export default class MutliplierParN0N extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = randint(2, 4)
    const b = randint(9, 24, [10, 20])
    this.reponse = 101 * a * b
    this.question = `Calculer $${b}\\times ${texNombre(a * 101)}$.`
    this.correction = `$${b}\\times ${a * 101}= ${101 * a * b}$<br><br>`
    this.correction += `${texteEnCouleur('Mentalement :')}<br>`
    this.correction += `${texteEnCouleur('On calcule $' + a + '\\times ' + b + '=' + texNombre(a * b) + '$ puis on multiplie par $101$ ce qui revient à ajouter $' + texNombre(a * b * 100) + '$ et $' + texNombre(a * b) + '$.')}`
  }
}
