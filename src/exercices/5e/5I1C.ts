import * as Blockly from 'blockly/core'
import * as En from 'blockly/msg/en'
import { init } from '../../lib/blockly/blocks'
import {
  addBloklyEditor,
  type BlocklyEditorOptions,
} from '../../lib/customElements/BlocklyEditor'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteFeedback } from '../../lib/interactif/questionMathLive'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Calculs numériques à représenter en code Blockly (expérimentation)'
export const interactifReady = true
export const interactifType = 'blockly-editor'

/**
 * Exercice expérimental pour BlocklyEditor.
 * @author Jean-Claude Lhote
 */
export const uuid = 'c1f91'

export const refs = {
  'fr-fr': [],
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

type OperationType = 'plus' | 'moins' | 'multi' | 'divise'

function operationLabel(op: OperationType): string {
  if (op === 'plus') return '+'
  if (op === 'moins') return '-'
  if (op === 'multi') return '×'
  return '÷'
}

function buildExpectedBlocks(
  a: number,
  b: number,
  op: OperationType,
): Record<string, unknown> {
  return {
    blocks: {
      blocks: [
        {
          type: 'demarrer',
          next: {
            block: {
              type: 'dire_2s',
              inputs: {
                MESSAGE: {
                  block: {
                    type: 'operation',
                    fields: {
                      op,
                    },
                    inputs: {
                      op1: {
                        block: {
                          type: 'textinput',
                          fields: {
                            NUM: String(a),
                          },
                        },
                      },
                      op2: {
                        block: {
                          type: 'textinput',
                          fields: {
                            NUM: String(b),
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  }
}

export default class CalculerFormuleParBlockly extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
  }

  nouvelleVersion(_numeroExercice: number) {
    this.consigne =
      'Représenter chaque calcul avec les blocs (Demarrer puis dire le resultat pendant 2 s).'

    const operationTypes: OperationType[] = ['plus', 'moins', 'multi', 'divise']

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const op = operationTypes[randint(0, operationTypes.length - 1)]
      const a = randint(2, 30)
      const b = op === 'divise' ? randint(2, 10) : randint(2, 30)

      const texteOperation = `${a} ${operationLabel(op)} ${b}`
      let texte = `Représenter ce calcul en Blockly : <b>${texteOperation}</b><br>`
      const texteCorr =
        'La rédaction attendue est composée de Demarrer puis dire [operation] pendant 2 s.'

      const solutionBlocks = buildExpectedBlocks(a, b, op)

      if (context.isHtml) {
        const options: BlocklyEditorOptions = {
          toolbox,
          solutionBlocks,
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

      if (this.questionJamaisPosee(i, a, b, op)) {
        this.listeQuestions.push(texte)
        this.listeCorrections.push(texteCorr)
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
    init()
  }
}
