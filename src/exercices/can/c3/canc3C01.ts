import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer un nombre à partir d’une phrase'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Date de publication septembre 2021

 */
export const uuid = '385b7'

export const refs = {
  'fr-fr': ['canc3C01'],
  'fr-ch': [],
}
export default class CalculsAutomatiques extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.clavierNumbers
  }

  nouvelleVersion() {
    const a = choice([50, 100, 40, 10, 20, 60, 200, 1000, 500])
    if (choice([true, false])) {
      switch (choice([1, 2, 3])) {
        case 1:
          this.reponse = a << 1
          this.question = `Calculer le double de $${a}$. `
          this.correction = `$${a}\\times 2 = ${a << 1}$`
          break
        case 2:
          this.reponse = a * 3
          this.question = `Calculer le triple de $${a}$.`
          this.correction = `$${a}\\times 3 = ${a * 3}$`
          break
        case 3:
          this.reponse = a * 10
          this.question = `Quel est le nombre dix fois plus grand que $${a}$ ? `
          this.correction = `$${a}\\times 10 = ${a * 10}$`
          break
      }
    } else {
      this.question = `Calculer la moitié de $${a}$.`
      this.reponse = a >> 1
      this.correction = `$${a}\\div 2 = ${a >> 1}$`
    }
  }
}
