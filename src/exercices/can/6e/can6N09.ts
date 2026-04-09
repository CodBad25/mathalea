import { choice } from '../../../lib/outils/arrayOutils'
import { sp } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Trouver le nombre qui suit'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Publié le 11 / 09 / 2021

 */
export const uuid = 'cc882'

export const refs = {
  'fr-fr': ['can6N09', '6N2A-flash8'],
  'fr-ch': [],
}
export default class PositionDesChiffres extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const f = choice([1, 10, 100])
    const a = randint(1, 9) * 10 + randint(1, 9)
    this.question = ` Compléter la suite logique : <br>$${texNombre((a + 0.6) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.7) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.8) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.9) / f)}$ ${sp(1)} ; ${sp(1)} .....`
    this.correction = `On passe d'un nombre au suivant en ajoutant $0,1$.<br>Donc le prochain nombre est : $${texNombre((a + 0.9) / f)}+${texNombre(0.1 / f)}=${texNombre((a + 1) / f)}$`
    this.reponse = (a + 1) / f
    this.canEnonce = 'Compléter la suite logique.'
    this.canReponseACompleter = `$${texNombre((a + 0.6) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.7) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.8) / f)}$ ${sp(1)} ; ${sp(1)}$${texNombre((a + 0.9) / f)}$${sp(1)} ; ${sp(1)} $\\ldots$`
  }
}
