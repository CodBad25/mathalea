import type LabyrintheElement from 'labyrinthe/src/LabyrintheElement'
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
}

export default class MathaleaLabyrintheElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-labyrinthe'

  private labyrintheElement: LabyrintheElement | null = null
  private gameEndListener: ((event: Event) => void) | null = null
  private hideScoreButtonFrame: number | null = null
  private hideScoreButtonTries = 0

  static create(options: MathaleaLabyrintheOptions): string {
    return super.create({
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
      this.scheduleHideScoreButton()
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
