import { context } from '../../modules/context'
import { Labyrinthe } from 'labyrinthe/src/labyrinthe/model'
import type LabyrintheElement from 'labyrinthe/src/LabyrintheElement'
import { tex2typst } from 'tex2typst'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

type Orientation = 'horizontal' | 'vertical'

export type MathaleaLabyrintheOptions = {
  id: string
  seed: string
  rows: number
  cols: number
  orientation?: Orientation
  goodAnswers: string[]
  badAnswers: string[]
  correction?: boolean
  disabled?: boolean
  numeroExercice?: number
  feedback?: boolean
  questionIndex?: number
}

function stripMathDelimiters(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 1
    ? trimmed.slice(1, -1)
    : trimmed
}

function typstCellContent(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') return '[]'
  const wasMath =
    trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 1
  if (!wasMath) return `[${trimmed.replace(/]/g, '\\]')}]`
  return `[$${tex2typst(stripMathDelimiters(trimmed))}$]`
}

export default class MathaleaLabyrintheElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-labyrinthe'

  private labyrintheElement: LabyrintheElement | null = null
  private gameEndListener: ((event: Event) => void) | null = null
  private hideScoreButtonFrame: number | null = null
  private hideScoreButtonTries = 0
  private staticOptions: MathaleaLabyrintheOptions | null = null

  static create(options: MathaleaLabyrintheOptions): string {
    const createElementForStaticRender = () => {
      const element = new MathaleaLabyrintheElement()
      element.staticOptions = options
      return element
    }

    if (context.isTypst) {
      return `<mathalea-typst>${createElementForStaticRender().renderTypst()}</mathalea-typst>`
    }
    if (!context.isHtml) return createElementForStaticRender().renderLatex()

    const html = super.create({
      id: options.id,
      seed: options.seed,
      rows: options.rows,
      cols: options.cols,
      orientation: options.orientation,
      goodAnswers: options.goodAnswers,
      badAnswers: options.badAnswers,
      correction: options.correction ?? false,
      disabled: options.disabled ?? false,
      numeroExercice: options.numeroExercice,
      interactivityOn: options.disabled ? false : true,
    })
    if (!options.feedback) return html
    return `${html}
      <div id=${`feedbackEx${options.numeroExercice}Q${options.questionIndex ?? 0}`}
        class="ml-2 py-2 text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest"
        >
      </div>`
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    void this.setup()
  }

  disconnectedCallback() {
    if (this.hideScoreButtonFrame != null) {
      window.cancelAnimationFrame(this.hideScoreButtonFrame)
      this.hideScoreButtonFrame = null
    }
    this.removeGameEndListener()
    this.labyrintheElement?.remove()
    this.labyrintheElement = null
    super.disconnectedCallback()
  }

  get value(): string {
    return this.labyrintheElement?.state ?? this.getAttribute('state') ?? ''
  }

  set value(nextValue: string) {
    const state = nextValue == null ? '' : String(nextValue)
    if (state.length > 0) {
      this.setAttribute('state', state)
    } else {
      this.removeAttribute('state')
    }
    if (this.labyrintheElement) {
      this.labyrintheElement.state = state
    }
  }

  get state(): string {
    return this.value
  }

  set state(nextState: string) {
    this.value = nextState
  }

  get win(): boolean {
    return this.labyrintheElement?.win ?? false
  }

  get correctClicks(): number {
    return this.labyrintheElement?.correctClicks ?? 0
  }

  get totalGood(): number {
    return this.labyrintheElement?.totalGood ?? 0
  }

  private async setup(): Promise<void> {
    await this.ensureLabyrintheGridIsDefined()
    if (!this.isConnected) return

    this.innerHTML = ''
    const element = document.createElement(
      'labyrinthe-grid',
    ) as LabyrintheElement
    element.seed = this.getAttribute('seed') ?? ''
    element.rows = this.readPositiveIntegerAttribute('rows', 6)
    element.cols = this.readPositiveIntegerAttribute('cols', 6)

    const orientation = this.readOrientation()
    if (orientation) {
      element.orientation = orientation
    }

    const state = this.getAttribute('state')
    if (state != null) {
      element.state = state
    }

    if (this.shouldDisable()) {
      element.disabled = true
    }

    this.appendChild(element)
    await this.waitUntilReady(element)
    if (!this.isConnected) return

    this.labyrintheElement = element
    element.setValues(
      this.readStringArrayAttribute('good-answers'),
      this.readStringArrayAttribute('bad-answers'),
    )

    if (this.isCorrection()) {
      element.showCorrection()
      element.disabled = true
    } else {
      this.gameEndListener = () => {
        const numeroExercice = this.getAttribute('numero-exercice')
        if (numeroExercice == null) return
        document
          .querySelector<HTMLButtonElement>(`#buttonScoreEx${numeroExercice}`)
          ?.click()
      }
      element.addEventListener('labyrinthe:gameend', this.gameEndListener)
      // this.scheduleHideScoreButton() Pourquoi masquer le bouton vérifier les réponses ? même si ça clique automatiquement, c'est un marqueur de l'interactivité !
    }
  }

  private async ensureLabyrintheGridIsDefined(): Promise<void> {
    if (customElements.get('labyrinthe-grid') !== undefined) return
    const { default: LabyrintheElement } =
      await import('labyrinthe/src/LabyrintheElement')
    if (customElements.get('labyrinthe-grid') === undefined) {
      customElements.define(
        'labyrinthe-grid',
        LabyrintheElement as unknown as CustomElementConstructor,
      )
    }
  }

  private waitUntilReady(element: LabyrintheElement): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (!this.isConnected || element.ready) {
          resolve()
          return
        }
        window.setTimeout(checkReady, 30)
      }
      checkReady()
    })
  }

  private readStringArrayAttribute(attributeName: string): string[] {
    const rawValue = this.getAttribute(attributeName)
    if (rawValue == null) return []
    try {
      const values = JSON.parse(rawValue)
      return Array.isArray(values) ? values.map(String) : []
    } catch {
      return []
    }
  }

  private readPositiveIntegerAttribute(
    attributeName: string,
    fallback: number,
  ): number {
    const value = Number(this.getAttribute(attributeName))
    return Number.isInteger(value) && value > 0 ? value : fallback
  }

  private readOrientation(): Orientation | null {
    const value = this.getAttribute('orientation')
    return value === 'horizontal' || value === 'vertical' ? value : null
  }

  private isCorrection(): boolean {
    return this.getAttribute('correction') === 'true'
  }

  private shouldDisable(): boolean {
    return !this.interactivityOn || this.getAttribute('disabled') === 'true'
  }

  protected renderLatex(): string {
    const options = this.getStaticOptions()
    const labyrinthe = this.createStaticLabyrinthe(options)
    const latex = options.correction
      ? labyrinthe.generateLatexCorrection()
      : labyrinthe.generateLatex()
    return options.correction
      ? `{\\renewcommand{\\arraystretch}{2}${latex}}`
      : `\n\n\\bigskip\n{\\renewcommand{\\arraystretch}{2}${latex}}`
  }

  protected renderTypst(): string {
    const options = this.getStaticOptions()
    const labyrinthe = this.createStaticLabyrinthe(options)
    const snapshot = labyrinthe.snapshot()
    const cells: string[] = []
    for (let row = 0; row < snapshot.rows; row++) {
      for (let col = 0; col < snapshot.cols; col++) {
        const cell = snapshot.grid?.[row]?.[col]
        const isGood = Boolean(cell?.isGood)
        const isStart =
          snapshot.start.row === row && snapshot.start.col === col
        const isEnd = snapshot.end.row === row && snapshot.end.col === col
        const shouldShade = isStart || isEnd || (options.correction && isGood)
        const body = typstCellContent(String(cell?.text ?? ''))
        const content =
          options.correction && isGood ? `[#strong(${body})]` : body
        cells.push(
          `table.cell(fill: ${shouldShade ? 'luma(90%)' : 'none'}, ${content})`,
        )
      }
    }
    return [
      '#block[',
      '#set text(size: 10pt)',
      '#table(',
      `  columns: ${snapshot.cols},`,
      '  stroke: 0.6pt + black,',
      '  inset: (x: 5pt, y: 8pt),',
      `  ${cells.join(',\n  ')}`,
      ')',
      ']',
    ].join('\n')
  }

  private getStaticOptions(): MathaleaLabyrintheOptions {
    if (this.staticOptions != null) return this.staticOptions
    return {
      id: this.id,
      seed: this.getAttribute('seed') ?? '',
      rows: this.readPositiveIntegerAttribute('rows', 6),
      cols: this.readPositiveIntegerAttribute('cols', 6),
      orientation: this.readOrientation() ?? undefined,
      goodAnswers: this.readStringArrayAttribute('good-answers'),
      badAnswers: this.readStringArrayAttribute('bad-answers'),
      correction: this.isCorrection(),
      disabled: this.shouldDisable(),
      numeroExercice: Number(this.getAttribute('numero-exercice')),
    }
  }

  private createStaticLabyrinthe(options: MathaleaLabyrintheOptions) {
    const labyrinthe = new Labyrinthe({
      seed: options.seed,
      rows: options.rows,
      cols: options.cols,
      orientation: options.orientation,
    })
    labyrinthe.regenerate()
    labyrinthe.setValues(options.goodAnswers, options.badAnswers)
    return labyrinthe
  }

  private scheduleHideScoreButton(): void {
    const numeroExercice = this.getAttribute('numero-exercice')
    if (numeroExercice == null) return
    const hide = () => {
      const button = document.querySelector<HTMLButtonElement>(
        `#buttonScoreEx${numeroExercice}`,
      )
      if (button) {
        button.style.display = 'none'
        this.hideScoreButtonFrame = null
        return
      }
      this.hideScoreButtonTries += 1
      if (this.hideScoreButtonTries < 30) {
        this.hideScoreButtonFrame = window.requestAnimationFrame(hide)
      } else {
        this.hideScoreButtonFrame = null
      }
    }
    this.hideScoreButtonTries = 0
    this.hideScoreButtonFrame = window.requestAnimationFrame(hide)
  }

  private removeGameEndListener(): void {
    if (!this.labyrintheElement || !this.gameEndListener) return
    this.labyrintheElement.removeEventListener(
      'labyrinthe:gameend',
      this.gameEndListener,
    )
    this.gameEndListener = null
  }
}

registerMathaleaCustomElement(MathaleaLabyrintheElement)
