import * as Blockly from 'blockly/core'
import * as En from 'blockly/msg/en'
import { ensureBlocklyBlocksInitialized } from '../../lib/blockly/blocks'
import {
  addBloklyEditor,
  BlocklyEditor,
  type BlocklyEditorOptions,
} from '../../lib/customElements/BlocklyEditor'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteFeedback } from '../../lib/interactif/questionMathLive'
import {
  areArithmeticAstsEquivalent,
  arithmeticAstToLatex,
  blocklyWorkspaceToArithmeticAst,
  buildBlocklySaySolutionBlocks,
  generateArithmeticAst,
} from '../../lib/mathFonctions/expression'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Calculs numériques à représenter en code par blocs'
export const interactifReady = true
export const interactifType = 'blockly-editor'
export const dateDePublication = '17/07/2026'

/**
 * Exercice pour manipuler les langages mathématiques et algorithmiques.
 * @author Jean-Claude Lhote
 */
export const uuid = 'c1f91'

export const refs = {
  'fr-fr': ['5I1C'],
  'fr-ch': [],
}

Blockly.setLocale(En as unknown as { [key: string]: string })

const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'flyoutToolbox',
  contents: [
    {
      kind: 'block',
      type: 'demarrer',
    },
    {
      kind: 'block',
      type: 'dire_2s',
    },
    {
      kind: 'block',
      type: 'operation',
    },
    {
      kind: 'block',
      type: 'textinput',
    },
  ],
}

const VERIFY_CALLBACK_NAME = '5I1C_AST_EQUIVALENCE'

BlocklyEditor.registerVerificationCallback(
  VERIFY_CALLBACK_NAME,
  ({ studentJson, expectedSolution }) => {
    if (expectedSolution == null) {
      return {
        isOk: false,
        feedback: 'Réponse attendue invalide.',
      }
    }

    const studentAst = blocklyWorkspaceToArithmeticAst(studentJson)
    if (studentAst == null) {
      return {
        isOk: false,
        feedback:
          "Impossible d'interpréter ta réponse Blockly en expression arithmétique, il semble que tu aies oublié de coder ta réponse.",
      }
    }

    const expectedAst = blocklyWorkspaceToArithmeticAst(expectedSolution)
    if (expectedAst == null) {
      return {
        isOk: false,
        feedback:
          "Impossible d'interpréter la correction attendue Blockly en AST.",
      }
    }

    const isOk = areArithmeticAstsEquivalent(studentAst, expectedAst)
    return {
      isOk,
      feedback: isOk
        ? 'Bravo !'
        : "L'expression ne correspond pas au calcul attendu.",
    }
  },
)

export default class CalculerFormuleParBlockly extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
    this.besoinFormulaireTexte = [
      "Types d'expressions",
      'Nombres séparés par des tirets :\n0: Mélange\n1: Une seule opération\n2:Deux opérations dont une prioritaire\n3: Trois opérations avec parenthèses\n4: Trois opérations sans parenthèses',
    ]
    this.sup = '0'
    this.besoinFormulaire2CaseACocher = [
      "Utiliser l'écriture fractionnaire pour les divisions",
      false,
    ]
    this.sup2 = false
    this.besoinFormulaire3CaseACocher = [
      'Autoriser les nombres négatifs',
      false,
    ]
    this.sup3 = false
    this.besoinFormulaire4CaseACocher = [
      'Toutes les opérations tombent justes',
      true,
    ]
    this.sup4 = true
  }

  nouvelleVersion(_numeroExercice: number) {
    const listeTypesDeQuestion = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 4,
      melange: 0,
      nbQuestions: this.nbQuestions,
      shuffle: false,
      defaut: 0,
    }).map(Number)
    this.consigne =
      'Représenter chaque calcul avec les blocs (Demarrer puis dire le resultat pendant 2 s).'

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const requestedType = listeTypesDeQuestion[i]
      const operationCount: 1 | 2 | 3 =
        requestedType <= 1 ? 1 : requestedType === 2 ? 2 : 3
      const requireParentheses = requestedType === 3
      const expressionAst = generateArithmeticAst(requestedType, randint, {
        operationCount,
        requireParentheses,
        negativeAllowed: this.sup3,
        strictInteger: this.sup4,
      })
      const texteOperation = arithmeticAstToLatex(expressionAst, !this.sup2)
      const expressionJson = JSON.stringify(expressionAst)

      let texte = `Représenter ce calcul en Blockly : $${miseEnEvidence(texteOperation, 'black')}$<br>`
      const solutionBlocks = buildBlocklySaySolutionBlocks(expressionAst)
      const correctionEditorId = `blockly-editorCorrEx${this.numeroExercice}Q${i}`
      const texteCorr = context.isHtml
        ? [
            'La solution Blockly est :<br>',
            BlocklyEditor.create({
              id: correctionEditorId,
              options: {
                toolbox,
                initialBlocks: solutionBlocks,
                height: '80px',
                interactivityOn: false,
              },
            }),
          ].join('')
        : `La solution Blockly correspond au calcul : ${texteOperation}`

      if (context.isHtml) {
        const options: BlocklyEditorOptions = {
          toolbox,
          solutionBlocks,
          verifyCallbackName: VERIFY_CALLBACK_NAME,
          height: '200px',
          interactivityOn: true,
          width: '100%',
        }
        texte += addBloklyEditor(this, i, options)
        texte += `<div class="ml-2 py-2" id="resultatCheckEx${this.numeroExercice}Q${i}"></div>`
        texte += ajouteFeedback(this, i)

        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: JSON.stringify({ solutionBlocks }),
            },
          },
          { formatInteractif: 'blockly-editor' },
        )
      }

      if (this.questionJamaisPosee(i, expressionJson)) {
        this.listeQuestions.push(texte)
        this.listeCorrections.push(texteCorr)
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
    ensureBlocklyBlocksInitialized()
  }
}
