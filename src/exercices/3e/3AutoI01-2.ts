import { ajouteQuestionMathlive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { createScratchSimulatorElement } from '../../lib/scratch/ScratchSimulator'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'

export const titre = 'Compléter un bloc personnalisé avec Scratch'
export const dateDePublication = '25/12/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * @author Jean-Claude Lhote
 */

export const uuid = '33d9b'

export const refs = {
  'fr-fr': ['3AutoI01-2'],
  'fr-ch': [],
}
export default class BlocPersonnaliseScratch2 extends Exercice {
  constructor() {
    super()
    this.typeExercice = 'Scratch'
    this.besoinFormulaireCaseACocher = ['Sujet original', false]
    this.sup = false
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    const x = this.sup ? 1 : randint(1, 7)
    const a = this.sup ? 8 : randint(1, 5, 4) * 2
    const b = this.sup ? 10 : randint(3, 10, 5) * 2
    const c = this.sup
      ? 2
      : Number.isInteger((x * a + b) / 4)
        ? choice([2, 4])
        : 2

    const blocACompléter = (a: number, b: number, c: number) => {
      return `\\begin{scratch}[blocks]\n
\\blockinit{quand \\greenflag est cliqué}
\\blocksensing{demander \\ovalnum{ Choisir un nombre } et attendre}
\\blockvariable{mettre  \\selectmenu{variable} à \\ovalsensing{réponse}}
\\blockvariable{mettre  \\selectmenu{resultat} à \\ovaloperator{\\ovalnum{${a}} * \\ovalvariable{variable}}}
\\blockvariable{mettre  \\selectmenu{resultat} à \\ovaloperator{\\ovalvariable{resultat} + \\ovalnum{${b}}}}
\\blockvariable{mettre  \\selectmenu{resultat} à \\ovaloperator{\\ovalvariable{resultat} / \\ovalnum{${c}}}}
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{J'obtiens comme résultat : } et \\ovalvariable{resultat}}}
\\end{scratch}`
    }
    const codeScratch = blocACompléter(a, b, c)
    const codeScratch3 = String(scratchblock(codeScratch))

    const codeVariable = scratchblock(
      context.isHtml
        ? `\\begin{scratch}[blocks]
\\ovalvariable{variable}
\\end{scratch}`
        : `\\ovalvariable{variable}`,
      'inline',
    )
    const codeResultat = scratchblock(
      context.isHtml
        ? `\\begin{scratch}[blocks]
\\ovalvariable{resultat}
\\end{scratch}`
        : `\\ovalvariable{resultat}`,
      'inline',
    )

    this.listeQuestions[0] =
      `On considère l'algorithme suivant :<br><br>
${codeScratch3}<br>
        Qu'obtient-on si on choisit $${x}$ comme nombre de départ ?<br><br>` +
      ajouteQuestionMathlive({
        exercice: this,
        question: 0,
        objetReponse: {
          reponse: { value: (x * a + b) / c },
        },
        typeInteractivite: 'mathlive',
      })
    this.listeCorrections[0] = `Si on choisit $${x}$ comme nombre de départ, alors ${codeVariable} prend la valeur $${x}$.<br>
   Ensuite, ${codeResultat} prend la valeur $${a} \\times ${x}=${a * x}$.<br>
   Puis, ${codeResultat} prend la valeur $${a * x} + ${b}=${a * x + b}$.<br>
   Enfin, ${codeResultat} prend la valeur $\\dfrac{${a * x + b}}{${c}}=${(x * a + b) / c}$.<br>
    On obtient donc comme résultat final : $${miseEnEvidence((x * a + b) / c)}$.<br>
    ${
      context.isHtml
        ? '<br>' +
          createScratchSimulatorElement(
            codeScratch
              .replace(
                '\\blocksensing{demander \\ovalnum{ Choisir un nombre } et attendre}\n',
                '',
              )
              .replace('\\ovalsensing{réponse}', `\\ovalnum{${x}}`),
            500,
            false,
          )
        : ''
    }
     `
  }
}
