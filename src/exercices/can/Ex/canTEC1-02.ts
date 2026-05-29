import { amcConvert } from '../../../lib/amc/amcBuilders'
import { Complexe } from '../../../lib/mathFonctions/Complexe'
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
 * @author Jean-claude Lhote

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
    this.nbQuestionsModifiable = false
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const z1 = new Complexe(randint(-5, 5, 0), randint(-5, 5, 0))
    const z2 = new Complexe(0, randint(-5, 5, 0))
    const z = z1.mul(z2)
    this.question = `On donne $~~a = ${z1.tex()}~~$ et $~~b = ${z2.tex()}$.<br>Calcule $a \\times b$.`
    this.correction = `$(${z1.tex()}) \\times (${z2.tex()}) = ${z.tex()}$`
    this.reponse = z1.mul(z2)
    this.autoCorrectionAMC[0] = {
      enonce: this.question,
      propositions: [
        {
          type: 'AMCNum',
          propositions: [
            {
              texte: this.correction,
              reponse: {
                valeur: Number(z.re),
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
                valeur: Number(z.im),
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
    this.questionsAMC[0] = amcConvert(this.autoCorrectionAMC[0])
  }
}
