import { context } from '../../modules/context'
import { bleuMathalea } from '../colors'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type IntervalleDroiteValue = {
  start: number
  end: number
  leftBracket: '[' | ']' | null
  rightBracket: '[' | ']' | null
}

export type IntervalleDroiteOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  min: number
  max: number
  labelValue?: number
  interactivityOn?: boolean
}

export class IntervalleDroiteElement extends MathaleaCustomElement {
  static readonly elementTag = 'intervalle-droite'
  private selectedValues: number[] = []
  private leftBracket: '[' | ']' | null = null
  private rightBracket: '[' | ']' | null = null

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  disconnectedCallback(): void {
    this.shadowRoot?.replaceChildren()
  }

  static create({
    id,
    numeroExercice,
    questionIndex,
    min,
    max,
    labelValue,
    interactivityOn = true,
  }: IntervalleDroiteOptions): string {
    return super.create({
      id:
        id ??
        `${IntervalleDroiteElement.elementTag}Ex${numeroExercice ?? 0}Q${questionIndex ?? 0}`,
      min,
      max,
      labelValue,
      interactivityOn,
    })
  }

  static formatStudentAnswer(rawAnswer: string): string {
    const parsed = parseValue(rawAnswer)
    if (parsed == null) return rawAnswer || 'aucune réponse'
    const left =
      parsed.leftBracket == null
        ? ']-\\infty'
        : `${parsed.leftBracket}${parsed.start}`
    const right =
      parsed.rightBracket == null
        ? '+\\infty['
        : `${parsed.end}${parsed.rightBracket}`
    return `$${left}\\,;\\,${right}$`
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const element = document.getElementById(
      `${this.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`,
    ) as IntervalleDroiteElement | null
    const actual = element?.value ?? ''
    const expected =
      exercice.autoCorrection[questionIndex]?.valeur?.reponse?.value
    const isOk = Array.isArray(expected)
      ? expected.map(String).includes(actual)
      : actual === String(expected ?? '')

    exercice.answers ??= {}
    if (element != null) {
      exercice.answers[element.id] = actual
      element.interactivityOn = false
    }
    const result = document.getElementById(
      `resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`,
    )
    const feedback = document.getElementById(
      `feedbackEx${exercice.numeroExercice}Q${questionIndex}`,
    )
    if (result != null) {
      result.innerHTML = isOk ? '😎' : '☹️'
      result.style.fontSize = 'large'
    }
    if (feedback != null) feedback.innerHTML = ''
    return {
      isOk,
      feedback: '',
      score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
    }
  }

  render(): string | void {
    if (!context.isHtml || context.isTypst) return this.renderLatex()
    if (this.shadowRoot == null) return

    const min = this.getNumberAttribute('min', 0)
    const max = this.getNumberAttribute('max', 1)
    const labelValue = this.getNumberAttribute('label-value', Number.NaN)
    const width = 560
    const height = 105
    const margin = 34
    const axisY = 48
    const usableWidth = width - 2 * margin
    const xFor = (value: number) =>
      margin + ((value - min) / Math.max(1, max - min)) * usableWidth
    const points = Array.from(
      { length: Math.max(0, Math.round(max - min)) + 1 },
      (_, index) => min + index,
    )
    const [start, end] = this.selectedValues
    const colored =
      start != null && end != null
        ? `<line class="colored" x1="${xFor(start)}" y1="${axisY}" x2="${xFor(end)}" y2="${axisY}" />`
        : ''
    const brackets =
      start != null && end != null
        ? `${this.bracketSvg(xFor(start), axisY, this.leftBracket)}${this.bracketSvg(xFor(end), axisY, this.rightBracket)}`
        : ''
    const ticks = points
      .map((value) => {
        const x = xFor(value)
        const selected = this.selectedValues.includes(value)
        const label =
          value === labelValue ? `<text x="${x}" y="82">${value}</text>` : ''
        return `<g class="point${selected ? ' selected' : ''}" data-value="${value}" role="button" tabindex="${this.interactivityOn ? '0' : '-1'}" aria-label="Graduation ${value}">
          <line x1="${x}" y1="39" x2="${x}" y2="57" />
          <circle cx="${x}" cy="${axisY}" r="13" />${label}
        </g>`
      })
      .join('')

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 650px; }
        .instructions { color: ${bleuMathalea}; font-size: .84rem; margin: 0 0 .25rem; opacity: .82; }
        .figure { display: flex; align-items: center; gap: .5rem; }
        svg { display: block; width: min(100%, 560px); height: auto; overflow: visible; }
        .axis { stroke: currentColor; stroke-width: 2; }
        .arrow { fill: currentColor; }
        .point line { stroke: currentColor; stroke-width: 1.5; pointer-events: none; }
        .point circle { fill: transparent; stroke: transparent; cursor: pointer; }
        .point text { fill: currentColor; font: 16px sans-serif; text-anchor: middle; pointer-events: none; }
        .point:hover circle, .point:focus circle { fill: ${bleuMathalea}18; stroke: ${bleuMathalea}; stroke-width: 1.5; outline: none; }
        .point.selected circle { fill: ${bleuMathalea}24; }
        .colored { stroke: ${bleuMathalea}; stroke-width: 7; stroke-linecap: butt; pointer-events: none; }
        .bracket { fill: none; stroke: ${bleuMathalea}; stroke-width: 3; stroke-linecap: round; pointer-events: none; }
        button { border: 1px solid ${bleuMathalea}80; border-radius: .35rem; background: transparent; color: ${bleuMathalea}; cursor: pointer; padding: .3rem .55rem; font: inherit; font-size: .82rem; white-space: nowrap; }
        button:hover, button:focus-visible { background: ${bleuMathalea}12; }
      </style>
      ${this.interactivityOn ? '<p class="instructions">Cliquer sur les deux extrémités de la partie à colorier. Cliquer ensuite sur une extrémité pour changer le sens de son crochet.</p>' : ''}
      <div class="figure">
        <svg viewBox="0 0 ${width} ${height}" aria-label="Droite graduée interactive">
          <line class="axis" x1="${margin - 10}" y1="${axisY}" x2="${width - margin + 10}" y2="${axisY}" />
          <path class="arrow" d="M ${width - margin + 16} ${axisY} l -8 -5 v 10 z" />
          ${colored}${ticks}${brackets}
        </svg>
        ${this.interactivityOn ? '<button type="button">Réinitialiser</button>' : ''}
      </div>`
    if (this.interactivityOn) this.attachListeners()
  }

  get value(): string {
    if (this.selectedValues.length !== 2) return ''
    return JSON.stringify({
      start: this.selectedValues[0],
      end: this.selectedValues[1],
      leftBracket: this.leftBracket,
      rightBracket: this.rightBracket,
    } satisfies IntervalleDroiteValue)
  }

  set value(nextValue: string) {
    const parsed = parseValue(nextValue)
    if (parsed == null) {
      this.reset()
      return
    }
    this.selectedValues = [parsed.start, parsed.end]
    const min = this.getNumberAttribute('min', 0)
    const max = this.getNumberAttribute('max', 1)
    this.leftBracket = parsed.start === min ? null : (parsed.leftBracket ?? '[')
    this.rightBracket = parsed.end === max ? null : (parsed.rightBracket ?? ']')
    this.render()
  }

  protected onInteractivityChanged(): void {
    this.render()
  }

  private attachListeners(): void {
    this.shadowRoot
      ?.querySelectorAll<SVGGElement>('.point')
      .forEach((point) => {
        const select = () => this.selectValue(Number(point.dataset.value))
        point.addEventListener('click', select)
        point.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            select()
          }
        })
      })
    this.shadowRoot
      ?.querySelector('button')
      ?.addEventListener('click', () => this.reset())
  }

  private selectValue(value: number): void {
    const min = this.getNumberAttribute('min', 0)
    const max = this.getNumberAttribute('max', 1)
    if (this.selectedValues.length < 2) {
      if (this.selectedValues.includes(value)) return
      this.selectedValues.push(value)
      this.selectedValues.sort((a, b) => a - b)
      if (this.selectedValues.length === 2) {
        this.leftBracket = this.selectedValues[0] === min ? null : '['
        this.rightBracket = this.selectedValues[1] === max ? null : ']'
      }
    } else if (value === this.selectedValues[0] && value !== min) {
      this.leftBracket = this.leftBracket === '[' ? ']' : '['
    } else if (value === this.selectedValues[1] && value !== max) {
      this.rightBracket = this.rightBracket === '[' ? ']' : '['
    }
    this.render()
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  private reset(): void {
    this.selectedValues = []
    this.leftBracket = null
    this.rightBracket = null
    this.render()
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  private bracketSvg(x: number, y: number, bracket: '[' | ']' | null): string {
    if (bracket == null) return ''
    const direction = bracket === '[' ? 1 : -1
    return `<path class="bracket" d="M ${x + direction * 6} ${y - 16} H ${x} V ${y + 16} H ${x + direction * 6}" />`
  }

  private getNumberAttribute(name: string, fallback: number): number {
    const value = Number(this.getAttribute(name))
    return Number.isFinite(value) ? value : fallback
  }
}

function parseValue(rawValue: string): IntervalleDroiteValue | null {
  try {
    const value = JSON.parse(rawValue) as Partial<IntervalleDroiteValue>
    if (
      typeof value.start !== 'number' ||
      typeof value.end !== 'number' ||
      value.start >= value.end ||
      !isBracket(value.leftBracket) ||
      !isBracket(value.rightBracket)
    ) {
      return null
    }
    return value as IntervalleDroiteValue
  } catch {
    return null
  }
}

function isBracket(value: unknown): value is '[' | ']' | null {
  return value === '[' || value === ']' || value === null
}

export function addIntervalleDroite(
  exercice: IExercice,
  questionIndex: number,
  options: Omit<IntervalleDroiteOptions, 'numeroExercice' | 'questionIndex'>,
): string {
  exercice.autoCorrection[questionIndex] ??= {}
  exercice.autoCorrection[questionIndex].formatInteractif =
    IntervalleDroiteElement.elementTag
  return IntervalleDroiteElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}

registerMathaleaCustomElement(IntervalleDroiteElement)

export default IntervalleDroiteElement
