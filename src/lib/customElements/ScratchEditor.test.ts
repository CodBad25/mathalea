import { describe, expect, it } from 'vitest'
import { areArithmeticAstsEquivalent } from '../mathFonctions/expression'
import {
  blocklyWorkspaceJsonToScratchXml,
  ScratchEditorElement,
  scratchWorkspaceXmlToArithmeticAst,
} from './ScratchEditor'

describe('ScratchEditor conversions', () => {
  it('convertit la solution Blockly de 5I1C en XML Scratch puis en AST', () => {
    const blocklySolution = {
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
                      fields: { op: 'plus' },
                      inputs: {
                        op1: {
                          block: { type: 'textinput', fields: { NUM: '7' } },
                        },
                        op2: {
                          block: {
                            type: 'operation',
                            fields: { op: 'multi' },
                            inputs: {
                              op1: {
                                block: {
                                  type: 'textinput',
                                  fields: { NUM: '3' },
                                },
                              },
                              op2: {
                                block: {
                                  type: 'textinput',
                                  fields: { NUM: '4' },
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
            },
          },
        ],
      },
    }

    const scratchXml = blocklyWorkspaceJsonToScratchXml(blocklySolution)
    const ast = scratchWorkspaceXmlToArithmeticAst(scratchXml)

    expect(scratchXml).toContain('event_whenflagclicked')
    expect(scratchXml).toContain('looks_sayforsecs')
    expect(scratchXml).toContain('operator_add')
    expect(scratchXml).toContain('looks_sayforsecs')
    expect(ast).not.toBeNull()
    expect(
      areArithmeticAstsEquivalent(ast!, {
        type: 'operation',
        op: 'plus',
        left: { type: 'number', value: 7 },
        right: {
          type: 'operation',
          op: 'multi',
          left: { type: 'number', value: 3 },
          right: { type: 'number', value: 4 },
        },
      }),
    ).toBe(true)
  })

  it('monte le custom element sans afficher le message d erreur', () => {
    const element = document.createElement(
      ScratchEditorElement.elementTag,
    ) as ScratchEditorElement
    element.setAttribute('height', '260px')
    document.body.append(element)

    try {
      expect(element.textContent).not.toContain(
        'Impossible de charger les blocs Scratch',
      )
      expect(element.querySelector('svg.blocklySvg')).not.toBeNull()
      expect(element.querySelector('.injectionDiv')).not.toBeNull()
    } finally {
      element.remove()
    }
  })

  it("n'affiche pas le bandeau d execution par defaut", () => {
    const element = document.createElement(
      ScratchEditorElement.elementTag,
    ) as ScratchEditorElement
    element.setAttribute('height', '260px')
    document.body.append(element)

    try {
      expect(element.querySelector('.scratch-editor-toolbar')).toBeNull()
      expect(element.querySelector('.scratch-editor-area')).not.toBeNull()
    } finally {
      element.remove()
    }
  })

  it("affiche le bandeau d execution lorsqu'il est active", () => {
    const element = document.createElement(
      ScratchEditorElement.elementTag,
    ) as ScratchEditorElement
    element.setAttribute('height', '260px')
    element.setAttribute('show-toolbar', 'true')
    element.setAttribute('enable-run', 'true')
    element.setAttribute('enable-stop', 'true')
    document.body.append(element)

    try {
      expect(element.querySelector('.scratch-editor-toolbar')).not.toBeNull()
      expect(element.querySelector('[data-action="run"]')).not.toBeNull()
      expect(element.querySelector('[data-action="stop"]')).not.toBeNull()
    } finally {
      element.remove()
    }
  })

  it('masque le menu des categories par defaut', () => {
    const element = document.createElement(
      ScratchEditorElement.elementTag,
    ) as ScratchEditorElement
    element.setAttribute('height', '260px')
    document.body.append(element)

    try {
      expect(element.querySelector('.scratchCategoryMenu')).toBeNull()
      expect(element.querySelector('.blocklyFlyout')).not.toBeNull()
    } finally {
      element.remove()
    }
  })

  it("affiche le menu des categories lorsqu'il est active", () => {
    const element = document.createElement(
      ScratchEditorElement.elementTag,
    ) as ScratchEditorElement
    element.setAttribute('height', '260px')
    element.setAttribute('show-categories', 'true')
    document.body.append(element)

    try {
      expect(element.querySelector('.scratchCategoryMenu')).not.toBeNull()
    } finally {
      element.remove()
    }
  })
})
