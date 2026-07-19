import * as ScratchBlocksModule from 'scratch-blocks/dist/vertical'
import scratchFr from '../../json/scratchFr.json'
import {
  areArithmeticAstsEquivalent,
  blocklyWorkspaceToArithmeticAst,
  type ArithmeticAst,
  type ArithmeticOperation,
} from '../mathFonctions/expression'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

type ScratchWorkspaceJson = Record<string, unknown>

export type ScratchToolboxCategory = {
  id: string
  name?: string
  colour?: string
  blocks: Array<
    | string
    | {
        opcode: string
        fields?: Record<string, string | number>
        inputs?: Record<string, string | number>
      }
  >
}

export type ScratchToolboxDefinition = {
  categories: ScratchToolboxCategory[]
}

export type ScratchEditorValue = {
  version: 1
  workspaceXml?: string
  workspaceJson?: ScratchWorkspaceJson
  projectJson?: string
  latex?: string
}

export type ScratchEditorOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  toolbox?: ScratchToolboxDefinition
  initialBlocks?: ScratchWorkspaceJson
  initialValue?: Partial<ScratchEditorValue>
  enableVm?: boolean
  showCategories?: boolean
  showToolbar?: boolean
  enableRun?: boolean
  enableStep?: boolean
  enableStop?: boolean
  interactivityOn?: boolean
  height?: string
  width?: string
}

type ScratchBlocksWorkspace = {
  clear(): void
  dispose(): void
  addChangeListener(listener: (event: { isUiEvent?: boolean }) => void): void
}

type ScratchBlocksApi = {
  inject(
    container: HTMLElement,
    options: Record<string, unknown>,
  ): ScratchBlocksWorkspace
  svgResize(workspace: ScratchBlocksWorkspace): void
  Xml: {
    workspaceToDom(workspace: ScratchBlocksWorkspace): Element
    domToText(dom: Element): string
    textToDom(xml: string): Element
    domToWorkspace(dom: Element, workspace: ScratchBlocksWorkspace): void
  }
  Msg?: Record<string, string>
}

function getScratchBlocksApi(): ScratchBlocksApi {
  const moduleValue = ScratchBlocksModule as unknown as {
    default?: unknown
    inject?: unknown
  }
  const candidate =
    moduleValue.inject != null ? ScratchBlocksModule : moduleValue.default
  return candidate as ScratchBlocksApi
}

const scratchBlocks = getScratchBlocksApi()
let areScratchMessagesTranslated = false

function ensureScratchBlocksFrenchMessages(): void {
  if (areScratchMessagesTranslated) return
  if (scratchBlocks.Msg == null) return

  Object.assign(
    scratchBlocks.Msg,
    scratchFr.commands as Record<string, string>,
    {
      EVENT_WHENFLAGCLICKED: 'quand %1 est cliqué',
      MOTION_TURNRIGHT: 'tourner %1 de %2 degrés',
      MOTION_TURNLEFT: 'tourner %1 de %2 degrés',
    },
  )

  areScratchMessagesTranslated = true
}

const scratchOpcodeByArithmeticOperation: Record<ArithmeticOperation, string> =
  {
    plus: 'operator_add',
    moins: 'operator_subtract',
    multi: 'operator_multiply',
    divise: 'operator_divide',
  }

const arithmeticOperationByScratchOpcode: Record<string, ArithmeticOperation> =
  {
    operator_add: 'plus',
    operator_subtract: 'moins',
    operator_multiply: 'multi',
    operator_divide: 'divise',
  }

class ScratchToolboxBuilder {
  static build(
    toolbox?: ScratchToolboxDefinition,
    showCategories = false,
  ): string {
    if (toolbox == null) return this.defaultToolbox(showCategories)
    if (!showCategories) {
      return this.flatToolbox(
        toolbox.categories.flatMap((category) => category.blocks),
      )
    }
    const categories = toolbox.categories
      .map((category) => {
        const colour = category.colour
          ? ` colour="${this.escapeAttribute(category.colour)}"`
          : ''
        const secondaryColour = category.colour
          ? ` secondaryColour="${this.escapeAttribute(category.colour)}"`
          : ''
        const blocks = category.blocks
          .map((block) => {
            const opcode = typeof block === 'string' ? block : block.opcode
            return this.blockXml(opcode)
          })
          .join('')
        return `<category name="${this.escapeAttribute(category.name ?? category.id)}" id="${this.escapeAttribute(category.id)}"${colour}${secondaryColour}>${blocks}</category>`
      })
      .join('')
    return `<xml id="toolbox-categories" style="display: none">${categories}</xml>`
  }

  private static defaultToolbox(showCategories: boolean): string {
    const categories: ScratchToolboxDefinition = {
      categories: [
        {
          id: 'events',
          name: 'Événements',
          colour: '#FFBF00',
          blocks: ['event_whenflagclicked'],
        },
        {
          id: 'looks',
          name: 'Apparence',
          colour: '#9966FF',
          blocks: ['looks_sayforsecs'],
        },
        {
          id: 'operators',
          name: 'Opérateurs',
          colour: '#59C059',
          blocks: [
            'operator_add',
            'operator_subtract',
            'operator_multiply',
            'operator_divide',
          ],
        },
        {
          id: 'values',
          name: 'Valeurs',
          colour: '#FFFFFF',
          blocks: ['math_number'],
        },
      ],
    }
    return this.build(categories, showCategories)
  }

  private static flatToolbox(blocks: ScratchToolboxCategory['blocks']): string {
    return [
      '<xml id="toolbox-blocks" style="display: none">',
      ...blocks.map((block) => {
        const opcode = typeof block === 'string' ? block : block.opcode
        return this.blockXml(opcode)
      }),
      '</xml>',
    ].join('')
  }

  private static blockXml(opcode: string): string {
    if (opcode === 'looks_sayforsecs') {
      return [
        '<block type="looks_sayforsecs">',
        '<value name="MESSAGE"><shadow type="text"><field name="TEXT">Bonjour !</field></shadow></value>',
        '<value name="SECS"><shadow type="math_number"><field name="NUM">2</field></shadow></value>',
        '</block>',
      ].join('')
    }

    if (opcode.startsWith('operator_')) {
      return [
        `<block type="${this.escapeAttribute(opcode)}">`,
        '<value name="NUM1"><shadow type="math_number"><field name="NUM">0</field></shadow></value>',
        '<value name="NUM2"><shadow type="math_number"><field name="NUM">0</field></shadow></value>',
        '</block>',
      ].join('')
    }

    if (opcode === 'math_number') {
      return '<block type="math_number"><field name="NUM">0</field></block>'
    }

    return `<block type="${this.escapeAttribute(opcode)}"></block>`
  }

  private static escapeAttribute(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }
}

class ScratchWorkspaceAdapter {
  private workspace: ScratchBlocksWorkspace

  constructor({
    container,
    toolbox,
    showCategories,
    readOnly,
    onChange,
  }: {
    container: HTMLElement
    toolbox?: ScratchToolboxDefinition
    showCategories: boolean
    readOnly: boolean
    onChange: () => void
  }) {
    ensureScratchBlocksFrenchMessages()
    this.workspace = scratchBlocks.inject(container, {
      toolbox: ScratchToolboxBuilder.build(toolbox, showCategories),
      comments: false,
      collapse: false,
      disable: false,
      media: `${import.meta.env.BASE_URL}scratch-blocks/media/`,
      oneBasedIndex: false,
      readOnly,
      scrollbars: true,
      sounds: false,
      toolboxPosition: 'start',
      trashcan: !readOnly,
      zoom: {
        controls: !readOnly,
        wheel: false,
        startScale: 0.75,
        maxScale: 2,
        minScale: 0.35,
        scaleSpeed: 1.2,
      },
    })
    this.workspace.addChangeListener((event) => {
      if (event.isUiEvent) return
      onChange()
    })
  }

  exportXml(): string {
    return scratchBlocks.Xml.domToText(
      scratchBlocks.Xml.workspaceToDom(this.workspace),
    )
  }

  loadXml(xml: string): void {
    this.workspace.clear()
    scratchBlocks.Xml.domToWorkspace(
      scratchBlocks.Xml.textToDom(xml),
      this.workspace,
    )
  }

  resize(): void {
    scratchBlocks.svgResize(this.workspace)
  }

  dispose(): void {
    this.workspace.dispose()
  }
}

export class ScratchEditorElement extends MathaleaCustomElement {
  static readonly elementTag = 'scratch-editor'

  private editorHeight: string | null = null
  private editorWidth: string | null = null
  private workspaceAdapter: ScratchWorkspaceAdapter | null = null
  private resizeHandler: (() => void) | null = null
  private runStatus: HTMLSpanElement | null = null

  static create(options: ScratchEditorOptions): string {
    const id =
      options.id ??
      `${ScratchEditorElement.elementTag}Ex${options.numeroExercice ?? 0}Q${options.questionIndex ?? 0}`

    return super.create({
      id,
      toolbox: options.toolbox,
      initialBlocks: options.initialBlocks,
      initialValue: options.initialValue,
      enableVm: options.enableVm ?? false,
      showCategories: options.showCategories ?? false,
      showToolbar: options.showToolbar ?? false,
      enableRun: options.enableRun ?? false,
      enableStep: options.enableStep ?? false,
      enableStop: options.enableStop ?? false,
      interactivityOn: options.interactivityOn ?? true,
      height: options.height ?? '260px',
      width: options.width ?? '100%',
    })
  }

  static formatStudentAnswer(rawAnswer: string): string {
    try {
      const parsed = JSON.parse(rawAnswer) as ScratchEditorValue
      const ast = scratchWorkspaceXmlToArithmeticAst(parsed.workspaceXml ?? '')
      if (ast == null) return 'aucun bloc'
      return 'programme Scratch'
    } catch {
      return rawAnswer
    }
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return questionHtml
      .replace(/<scratch-editor[^>]*\/>/gi, '')
      .replace(/<scratch-editor[^>]*>[^]*?<\/scratch-editor>/gi, '')
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const id = `${ScratchEditorElement.elementTag}Ex${exercice.numeroExercice}Q${i}`
    const editor = document.getElementById(id) as ScratchEditorElement | null
    const spanResultat = document.querySelector(
      `#resultatCheckEx${exercice.numeroExercice}Q${i}`,
    )
    const divFeedback = document.querySelector(
      `#feedbackEx${exercice.numeroExercice}Q${i}`,
    ) as HTMLElement | null

    if (!editor) {
      if (spanResultat) spanResultat.innerHTML = '☹️'
      return {
        isOk: false,
        feedback: 'Éditeur Scratch introuvable.',
        score: { nbBonnesReponses: 0, nbReponses: 1 },
      }
    }

    const currentValue = editor.getEditorValue()
    if (exercice.answers == null) exercice.answers = {}
    exercice.answers[id] = JSON.stringify(currentValue)
    editor.interactivityOn = false

    const studentAst = scratchWorkspaceXmlToArithmeticAst(
      currentValue.workspaceXml ?? '',
    )
    const expectedRaw = exercice.autoCorrection[i]?.valeur?.reponse?.value
    const expectedAst = expectedScratchEditorAst(expectedRaw)
    const isOk =
      studentAst != null &&
      expectedAst != null &&
      areArithmeticAstsEquivalent(studentAst, expectedAst)
    const feedback = isOk
      ? 'Bravo !'
      : studentAst == null
        ? "Impossible d'interpréter ta réponse Scratch en expression arithmétique."
        : 'Le programme ne correspond pas au calcul attendu.'

    if (spanResultat) spanResultat.innerHTML = isOk ? '😎' : '☹️'
    if (divFeedback) {
      divFeedback.innerHTML = feedback
      divFeedback.style.display = 'block'
    }

    return {
      isOk,
      feedback,
      score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
    }
  }

  connectedCallback(): void {
    this.hydrateCommonAttributes()
    this.editorHeight = this.getAttribute('height')
    this.editorWidth = this.getAttribute('width')
    this.render()
  }

  disconnectedCallback(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    this.workspaceAdapter?.dispose()
    this.workspaceAdapter = null
  }

  get value(): string {
    return JSON.stringify(this.getEditorValue())
  }

  set value(nextValue: string) {
    try {
      this.update(JSON.parse(nextValue) as ScratchEditorValue)
    } catch {
      // Valeur invalide : on ignore sans casser l'interface.
    }
  }

  render(): void {
    const resolvedWidth = this.editorWidth ?? '100%'
    const resolvedHeight = this.editorHeight ?? '260px'
    const isInteractive = this.interactivityOn
    const showToolbar = this.getBooleanAttribute('show-toolbar', false)
    const workspaceHeight = showToolbar
      ? `calc(${resolvedHeight} - 38px)`
      : resolvedHeight
    const overlayInset = showToolbar ? '38px 0 0 0' : '0'

    this.innerHTML = `
      <style>
        scratch-editor .scratch-editor-area .blocklyToolboxDiv {
          border-right: 1px solid #d8dee9;
          box-shadow: 1px 0 0 #eef1f6;
          background: #ffffff;
          z-index: 20;
        }
        scratch-editor .scratch-editor-area .scratchCategoryMenu {
          border-right: 1px solid #d8dee9;
          background: #ffffff;
        }
        scratch-editor .scratch-editor-area .blocklyFlyoutBackground {
          fill: #f7f8fb;
          stroke: #d8dee9;
          stroke-width: 1px;
        }
        scratch-editor .scratch-editor-area .blocklyMainBackground {
          fill: #ffffff;
          stroke: #e5e7eb;
          stroke-width: 1px;
        }
        scratch-editor .scratch-editor-area .scratchCategoryMenuItem {
          border-radius: 6px;
          margin: 2px 6px;
        }
      </style>
      <div class="scratch-editor-wrapper" style="position: relative; width: ${resolvedWidth}; min-height: ${resolvedHeight}; border: 1px solid #d9dde7; border-radius: 8px; overflow: hidden; background: #ffffff;">
        ${
          showToolbar
            ? `<div class="scratch-editor-toolbar" style="display: flex; align-items: center; gap: 0.5rem; min-height: 38px; padding: 0.35rem 0.5rem; border-bottom: 1px solid #e6e8ef; background: #f7f8fb;">
          <button type="button" data-action="run" title="Exécuter" style="display: ${this.getBooleanAttribute('enable-run', false) ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid #cfd5e3; border-radius: 6px; background: #fff; cursor: pointer;">▶</button>
          <button type="button" data-action="stop" title="Arrêter" style="display: ${this.getBooleanAttribute('enable-stop', false) ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid #cfd5e3; border-radius: 6px; background: #fff; cursor: pointer;">■</button>
          <span class="scratch-editor-status" aria-live="polite" style="font-size: 0.85rem; color: #475569;"></span>
        </div>`
            : ''
        }
        <div class="scratch-editor-area" style="width: ${resolvedWidth}; height: ${workspaceHeight}; min-height: 120px; pointer-events: ${isInteractive ? 'auto' : 'none'};"></div>
        <div class="scratch-editor-overlay" style="display: ${isInteractive ? 'none' : 'block'}; position: absolute; inset: ${overlayInset}; z-index: 1000; pointer-events: auto; background: transparent;"></div>
      </div>
    `

    this.runStatus = this.querySelector('.scratch-editor-status')
    this.querySelector('[data-action="run"]')?.addEventListener('click', () =>
      this.showRunPreview(),
    )
    this.querySelector('[data-action="stop"]')?.addEventListener('click', () =>
      this.clearRunPreview(),
    )

    const area = this.querySelector(
      '.scratch-editor-area',
    ) as HTMLDivElement | null
    if (!area) return

    this.workspaceAdapter?.dispose()
    try {
      this.workspaceAdapter = new ScratchWorkspaceAdapter({
        container: area,
        toolbox: this.getToolboxAttribute(),
        showCategories: this.getBooleanAttribute('show-categories', false),
        readOnly: !isInteractive,
        onChange: () => {
          this.dispatchEvent(
            new CustomEvent('change', { bubbles: true, detail: this.value }),
          )
        },
      })
    } catch (error) {
      this.workspaceAdapter = null
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error)
      area.innerHTML = `<div style="padding: 0.75rem; color: #b91c1c;">Impossible de charger les blocs Scratch.<br><small>${this.escapeHtml(message)}</small></div>`
      console.error('Impossible de charger les blocs Scratch', error)
      window.notify?.('Impossible de charger les blocs Scratch', { error })
      return
    }

    const initialValue = this.getValueAttribute('initial-value')
    if (initialValue) {
      this.update({ version: 1, ...initialValue })
    } else {
      const initialBlocks = this.getJsonAttribute('initial-blocks')
      if (initialBlocks) {
        this.update({
          version: 1,
          workspaceXml: blocklyWorkspaceJsonToScratchXml(initialBlocks),
        })
      }
    }

    this.resizeHandler = () => this.workspaceAdapter?.resize()
    window.addEventListener('resize', this.resizeHandler)
    this.resizeHandler()
  }

  update(value: ScratchEditorValue): void {
    if (value.workspaceXml != null) {
      this.workspaceAdapter?.loadXml(value.workspaceXml)
      return
    }
    if (value.workspaceJson != null) {
      this.workspaceAdapter?.loadXml(
        blocklyWorkspaceJsonToScratchXml(value.workspaceJson),
      )
    }
  }

  getEditorValue(): ScratchEditorValue {
    return {
      version: 1,
      workspaceXml: this.workspaceAdapter?.exportXml() ?? '',
      latex: '',
    }
  }

  protected onInteractivityChanged(isOn: boolean): void {
    const overlay = this.querySelector(
      '.scratch-editor-overlay',
    ) as HTMLDivElement | null
    const area = this.querySelector(
      '.scratch-editor-area',
    ) as HTMLDivElement | null
    if (overlay) overlay.style.display = isOn ? 'none' : 'block'
    if (area) area.style.pointerEvents = isOn ? 'auto' : 'none'
  }

  private getBooleanAttribute(name: string, defaultValue: boolean): boolean {
    if (!this.hasAttribute(name)) return defaultValue
    return this.getAttribute(name) !== 'false'
  }

  private getToolboxAttribute(): ScratchToolboxDefinition | undefined {
    const raw = this.getAttribute('toolbox')
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as ScratchToolboxDefinition
    } catch {
      return undefined
    }
  }

  private getJsonAttribute(name: string): ScratchWorkspaceJson | null {
    const raw = this.getAttribute(name)
    if (!raw) return null
    try {
      return JSON.parse(raw) as ScratchWorkspaceJson
    } catch {
      return null
    }
  }

  private getValueAttribute(
    name: 'initial-value',
  ): Partial<ScratchEditorValue> | null {
    const raw = this.getAttribute(name)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Partial<ScratchEditorValue>
    } catch {
      return null
    }
  }

  private showRunPreview(): void {
    const ast = scratchWorkspaceXmlToArithmeticAst(
      this.getEditorValue().workspaceXml ?? '',
    )
    if (this.runStatus) {
      this.runStatus.textContent =
        ast == null ? 'Programme incomplet' : 'Programme prêt'
    }
  }

  private clearRunPreview(): void {
    if (this.runStatus) this.runStatus.textContent = ''
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }
}

export function addScratchEditor(
  exercice: IExercice,
  questionIndex: number,
  options: ScratchEditorOptions,
): string {
  return ScratchEditorElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice,
    questionIndex,
  })
}

function expectedScratchEditorAst(expectedRaw: unknown): ArithmeticAst | null {
  if (typeof expectedRaw !== 'string') return null
  try {
    const parsed = JSON.parse(expectedRaw) as {
      solutionBlocks?: unknown
      solutionScratchXml?: unknown
    }
    if (typeof parsed.solutionScratchXml === 'string') {
      return scratchWorkspaceXmlToArithmeticAst(parsed.solutionScratchXml)
    }
    return blocklyWorkspaceToArithmeticAst(parsed.solutionBlocks)
  } catch {
    return null
  }
}

export function blocklyWorkspaceJsonToScratchXml(
  workspaceJson: unknown,
): string {
  const ast = blocklyWorkspaceToArithmeticAst(workspaceJson)
  if (ast == null)
    return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'
  return astToScratchWorkspaceXml(ast)
}

function astToScratchWorkspaceXml(ast: ArithmeticAst): string {
  return [
    '<xml xmlns="https://developers.google.com/blockly/xml">',
    '<block type="event_whenflagclicked" x="24" y="24">',
    '<next>',
    '<block type="looks_sayforsecs">',
    '<value name="MESSAGE">',
    astToScratchValueXml(ast),
    '</value>',
    '<value name="SECS"><shadow type="math_number"><field name="NUM">2</field></shadow></value>',
    '</block>',
    '</next>',
    '</block>',
    '</xml>',
  ].join('')
}

function astToScratchValueXml(ast: ArithmeticAst): string {
  if (ast.type === 'number') {
    return `<shadow type="math_number"><field name="NUM">${escapeXmlText(String(ast.value))}</field></shadow>`
  }

  const opcode = scratchOpcodeByArithmeticOperation[ast.op]
  return [
    `<block type="${opcode}">`,
    '<value name="NUM1">',
    astToScratchValueXml(ast.left),
    '</value>',
    '<value name="NUM2">',
    astToScratchValueXml(ast.right),
    '</value>',
    '</block>',
  ].join('')
}

export function scratchWorkspaceXmlToArithmeticAst(
  xml: string,
): ArithmeticAst | null {
  if (xml.trim() === '') return null
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError != null) return null
  const topBlocks = Array.from(doc.documentElement.children).filter(
    (element) => element.tagName.toLowerCase() === 'block',
  )
  for (const block of topBlocks) {
    const valueBlock = findScratchMessageValueBlock(block)
    if (valueBlock == null) continue
    const ast = scratchValueBlockToArithmeticAst(valueBlock)
    if (ast != null) return ast
  }
  return null
}

function findScratchMessageValueBlock(block: Element): Element | null {
  if (block.getAttribute('type') === 'looks_sayforsecs') {
    return readScratchValueBlock(block, 'MESSAGE')
  }
  const nextBlock = firstElement(block, 'next')?.querySelector(':scope > block')
  return nextBlock == null ? null : findScratchMessageValueBlock(nextBlock)
}

function scratchValueBlockToArithmeticAst(
  block: Element,
): ArithmeticAst | null {
  const type = block.getAttribute('type')
  if (type === 'math_number') {
    const raw = firstElement(block, 'field', 'NUM')?.textContent ?? ''
    const value = Number(raw.replace(',', '.'))
    return Number.isFinite(value) ? { type: 'number', value } : null
  }

  const operation =
    type == null ? undefined : arithmeticOperationByScratchOpcode[type]
  if (operation == null) return null

  const left = readScratchValueBlock(block, 'NUM1')
  const right = readScratchValueBlock(block, 'NUM2')
  if (left == null || right == null) return null
  const leftAst = scratchValueBlockToArithmeticAst(left)
  const rightAst = scratchValueBlockToArithmeticAst(right)
  if (leftAst == null || rightAst == null) return null

  return {
    type: 'operation',
    op: operation,
    left: leftAst,
    right: rightAst,
  }
}

function readScratchValueBlock(
  block: Element,
  inputName: string,
): Element | null {
  const value = firstElement(block, 'value', inputName)
  if (value == null) return null
  return (
    value.querySelector(':scope > block') ??
    value.querySelector(':scope > shadow')
  )
}

function firstElement(
  parent: Element,
  tagName: string,
  name?: string,
): Element | null {
  return (
    Array.from(parent.children).find((child) => {
      if (child.tagName.toLowerCase() !== tagName) return false
      return name == null || child.getAttribute('name') === name
    }) ?? null
  )
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

registerMathaleaCustomElement(ScratchEditorElement)
