import { complex, multiply, type Complex } from 'mathjs'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'produit de nombres complexes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDePublication = '26/10/2021'

/**
 * Question de can : calcul de la somme de deux nombres complexes
 * @author Jean-Claude Lhote

*/
export const uuid = '30cc1'

export const refs = {
  'fr-fr': ['canTEC1-02'],
  'fr-ch': ['3mNC-5'],
}
export default class SommeDeComplexes extends ExerciceSimple {
  constructor() {
    super()

    this.nbQuestions = 1
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const z1 = complex(randint(-5, 5, 0), randint(-5, 5, 0))
    const z2 = complex(0, randint(-5, 5, 0))
    const z = multiply(z1, z2) as Complex
    this.question = `On donne $~~a = ${z1.toString()}~~$ et $~~b = ${z2.toString()}$.<br>Calcule $a \\times b$.`
    this.correction = `$(${z1.toString()}) \\times (${z2.toString()}) = ${z.toString()}$`
    this.reponse = multiply(z1, z2).toString()
    if (context.isAmc)
      this.autoCorrection[0] = {
        enonce: this.question,
        propositions: [
          {
            type: 'AMCNum',
            propositions: {
              texte: this.correction,
            },
            reponse: {
              valeur: z.re,
              digits: 2,
              decimals: 0,
              signe: true,
              approx: 0,
            },
          },
          {
            type: 'AMCNum',
            propositions: {
              texte: '',
            },
            reponse: {
              valeur: z.im,
              digits: 2,
              decimals: 0,
              signe: true,
              approx: 0,
            },
          },
        ],
      }
  }
}
