import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer avec triple et moitié'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '52336'

export const refs = {
  'fr-fr': ['can5C04', 'auto6P3A-flash5'],
  'fr-ch': ['10FA3-14'],
}
export default class TripleEtMoitie extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const a = randint(3, 20)
    this.question = `Le triple d'un nombre vaut $${3 * a}$, combien vaut sa moitié ?`
    this.correction = `Le nombre est $${a}$, sa moitié est $${texNombre(a / 2)}$.`
    this.correction += texteEnCouleur(`
    <br> Mentalement : <br>
    Si le triple du nombre est $${3 * a}$, ce nombre est : $${3 * a}\\div 3=${a}$.<br>
    Puisqu'on cherche sa moitié, on le divise par $2$, soit  $${a}\\div 2=${texNombre(a / 2)}$.<br>
     `)
    this.reponse = a / 2
  }
}
