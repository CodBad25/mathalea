import { Complexe } from '../../../lib/mathFonctions/Complexe'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Somme de nombres complexes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDePublication = '26/10/2021'

/**
 * Question de can : calcul de la somme de deux nombres complexes
 * @author Jean-claude Lhote

*/
export const uuid = '71292'

export const refs = {
  'fr-fr': ['canTEC1-01'],
  'fr-ch': ['3mNC-1'],
}
export default class SommeDeComplexes extends ExerciceSimple {
  constructor() {
    super()

    this.nbQuestions = 1
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const z1 = new Complexe(randint(-5, 5), randint(-5, 5))
    const z2 = new Complexe(randint(-5, 5), randint(-5, 5))
    this.question = `On donne $~~a = ${z1.toString()}~~$ et $~~b = ${z2.toString()}$.<br>Calcule $a + b$.`
    this.correction = `$${z1.toString()} + ${z2.toString()} = ${z1.add(z2).tex()}$`
    this.reponse = z1.add(z2)
    if (context.isAmc)
      this.autoCorrectionAMC[0] = {
        enonce: this.question,
        propositions: [
          {
            type: 'AMCNum',
            propositions: [
              {
                texte: this.correction,
                reponse: {
                  valeur: Number(z1.add(z2).re),
                  param: {
                    digits: 2,
                    decimals: 0,
                    signe: true,
                    approx: 0,
                  },
                },
              },
            ],
          },
          {
            type: 'AMCNum',
            propositions: [
              {
                texte: '',
                reponse: {
                  valeur: Number(z1.add(z2).im),
                  param: {
                    digits: 2,
                    decimals: 0,
                    signe: true,
                    approx: 0,
                  },
                },
              },
            ],
          },
        ],
      }
  }
}
