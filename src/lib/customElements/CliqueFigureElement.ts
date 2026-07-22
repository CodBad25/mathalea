import { context } from '../../modules/context'
import type { ClickFigures, IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type FigureClicable = HTMLElement & {
  etat: boolean
  hasMathaleaListener: boolean
}

export type CliqueFigureOptions = {
  id?: string
  numeroExercice: number
  questionIndex: number
  figures: ClickFigures
  interactivityOn?: boolean
}

type CliqueFigureVerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export class CliqueFigureElement extends MathaleaCustomElement {
  static readonly elementTag = 'clique-figure'

  private figures: FigureClicable[] = []

  static create({
    id,
    numeroExercice,
    questionIndex,
    figures,
    interactivityOn = true,
  }: CliqueFigureOptions): string {
    return super.create({
      id:
        id ??
        `${CliqueFigureElement.elementTag}Ex${numeroExercice}Q${questionIndex}`,
      numeroExercice,
      questionIndex,
      figures,
      interactivityOn,
    })
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): CliqueFigureVerificationResult {
    if ('callback' in exercice && typeof exercice.callback === 'function') {
      ;(exercice.callback as (exercice: IExercice, i: number) => void)(
        exercice,
        questionIndex,
      )
    }
    let element = document.querySelector(
      `#${CliqueFigureElement.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`,
    ) as CliqueFigureElement | null
    if (element == null) {
      addCliqueFigureElementToQuestion(exercice, questionIndex)
      element = document.querySelector(
        `#${CliqueFigureElement.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`,
      ) as CliqueFigureElement | null
    }

    const result = element?.verify(exercice, questionIndex) ?? 'KO'

    return {
      isOk: result === 'OK',
      feedback: '',
      score: {
        nbBonnesReponses: result === 'OK' ? 1 : 0,
        nbReponses: 1,
      },
    }
  }

  static formatStudentAnswer(rawAnswer: string): string {
    const value = parseCliqueFigureValue(rawAnswer)
    if (value == null) return rawAnswer
    if (value.length === 0) return 'aucune'
    return value.join(' ; ')
  }

  connectedCallback(): void {
    super.connectedCallback()
  }

  disconnectedCallback(): void {
    this.detachListeners()
  }

  render(): string | void {
    if (!context.isHtml || context.isTypst) return this.renderLatex()
    this.figures = this.getConfiguredFigures()
    this.figures.forEach((figure) => this.prepareFigure(figure))
  }

  get value(): string {
    return JSON.stringify(this.getSelectedFigureIds())
  }

  set value(nextValue: string | string[]) {
    this.update(nextValue)
  }

  update(nextValue: string | string[]): void {
    const selectedIds = new Set(parseCliqueFigureValue(nextValue) ?? [])
    this.figures = this.getConfiguredFigures()
    this.figures.forEach((figure) => {
      figure.etat = selectedIds.has(figure.id)
      this.paintFigure(figure)
    })
  }

  protected onInteractivityChanged(isOn: boolean): void {
    if (isOn) {
      this.render()
      return
    }
    this.detachListeners()
  }

  verify(exercice: IExercice, questionIndex: number): 'OK' | 'KO' {
    exercice.answers ??= {}
    const feedback = this.ensureResultElement(exercice, questionIndex)
    feedback.innerHTML = ''
    feedback.style.marginBottom = '20px'

    let hasError = false
    let selectedCount = 0
    const figures = this.getConfiguredObjects(exercice, questionIndex)

    for (const figureConfig of figures) {
      const figure = document.getElementById(
        figureConfig.id,
      ) as FigureClicable | null
      if (figure == null) continue
      if (figure.etat) {
        selectedCount++
        exercice.answers[figureConfig.id] = '1'
      }
      if (figure.etat !== figureConfig.solution) hasError = true
    }

    exercice.answers[this.id] = this.value
    this.interactivityOn = false

    const result = selectedCount > 0 && !hasError ? 'OK' : 'KO'
    feedback.innerHTML = result === 'OK' ? '😎' : '☹️'
    feedback.style.fontSize = 'large'
    return result
  }

  private prepareFigure(figure: FigureClicable): void {
    if (!this.interactivityOn) return
    if (figure.hasMathaleaListener) return
    figure.addEventListener('mouseenter', mouseOverSvgEffect)
    figure.addEventListener('mouseleave', mouseOutSvgEffect)
    figure.addEventListener('click', mouseSvgClick)
    if (figure.etat !== true) figure.etat = false
    figure.hasMathaleaListener = true
  }

  private detachListeners(): void {
    for (const figure of this.getConfiguredFigures()) {
      figure.removeEventListener('mouseenter', mouseOverSvgEffect)
      figure.removeEventListener('mouseleave', mouseOutSvgEffect)
      figure.removeEventListener('click', mouseSvgClick)
      figure.hasMathaleaListener = false
    }
  }

  private getSelectedFigureIds(): string[] {
    return this.getConfiguredFigures()
      .filter((figure) => figure.etat)
      .map((figure) => figure.id)
  }

  private getConfiguredFigures(): FigureClicable[] {
    return this.getConfiguredObjects().flatMap((figure) => {
      const element = document.getElementById(figure.id)
      return element == null ? [] : [element as FigureClicable]
    })
  }

  private getConfiguredObjects(
    exercice?: IExercice,
    questionIndex?: number,
  ): ClickFigures {
    if (
      exercice?.cliqueFiguresArray != null &&
      questionIndex != null &&
      Array.isArray(exercice.cliqueFiguresArray[questionIndex])
    ) {
      return exercice.cliqueFiguresArray[questionIndex]
    }
    return parseFigures(this.getAttribute('figures'))
  }

  private ensureResultElement(
    exercice: IExercice,
    questionIndex: number,
  ): HTMLElement {
    const id = `resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`
    const existing = document.getElementById(id)
    if (existing != null) return existing

    const container = document.getElementById(
      `exercice${exercice.numeroExercice}`,
    )
    const feedback = document.createElement('div')
    feedback.id = id
    container?.appendChild(feedback)
    return feedback
  }

  private paintFigure(figure: FigureClicable): void {
    figure.style.border = figure.etat
      ? '3px solid #f15929'
      : '3px solid transparent'
  }
}

export function addCliqueFigure(
  exercice: IExercice,
  questionIndex: number,
  options: Partial<
    Omit<CliqueFigureOptions, 'numeroExercice' | 'questionIndex'>
  > = {},
): string {
  if (!context.isHtml) return ''
  const figures =
    options.figures ?? exercice.cliqueFiguresArray?.[questionIndex] ?? []
  exercice.autoCorrection[questionIndex] ??= {}
  exercice.autoCorrection[questionIndex].formatInteractif =
    CliqueFigureElement.elementTag
  return CliqueFigureElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
    figures,
  })
}

export function prepareCliqueFigure(exercice: IExercice): void {
  for (let i = 0; i < exercice.nbQuestions; i++) {
    const selector = `#${CliqueFigureElement.elementTag}Ex${exercice.numeroExercice}Q${i}`
    if (document.querySelector(selector) != null) continue
    addCliqueFigureElementToQuestion(exercice, i)
  }
}

export function addCliqueFigureElementToQuestion(
  exercice: IExercice,
  questionIndex: number,
): void {
  const figures = exercice.cliqueFiguresArray?.[questionIndex]
  if (!Array.isArray(figures)) return
  const host = document.createElement(CliqueFigureElement.elementTag)
  host.id = `${CliqueFigureElement.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`
  host.setAttribute('numero-exercice', String(exercice.numeroExercice ?? 0))
  host.setAttribute('question-index', String(questionIndex))
  host.setAttribute('figures', JSON.stringify(figures))
  document
    .getElementById(
      `resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`,
    )
    ?.before(host)
  if (!host.isConnected) document.body.appendChild(host)
}

export function questionCliqueFigure(figSvg: FigureClicable): void {
  if (figSvg.hasMathaleaListener) return
  figSvg.addEventListener('mouseenter', mouseOverSvgEffect)
  figSvg.addEventListener('mouseleave', mouseOutSvgEffect)
  figSvg.addEventListener('click', mouseSvgClick)
  figSvg.etat = false
  figSvg.hasMathaleaListener = true
}

export function indexQuestionCliqueFigure(exercice: IExercice, i: number) {
  const elementArray = (exercice.cliqueFiguresArray?.[i] ?? [])
    .map((figure) => document.getElementById(figure.id))
    .filter((elt): elt is HTMLElement => elt !== null)

  const figs = elementArray.sort(documentPositionComparator)
  const numbs = []
  for (let j = 0; j < figs.length; j++) {
    if ((figs[j] as FigureClicable).etat) numbs.push((j + 1).toString())
  }
  return numbs.join(';')
}

export function verifQuestionCliqueFigure(
  exercice: IExercice,
  i: number,
): 'OK' | 'KO' {
  const selector = `#${CliqueFigureElement.elementTag}Ex${exercice.numeroExercice}Q${i}`
  let element = document.querySelector(selector) as CliqueFigureElement | null
  if (element == null) {
    addCliqueFigureElementToQuestion(exercice, i)
    element = document.querySelector(selector) as CliqueFigureElement | null
  }
  return element?.verify(exercice, i) ?? 'KO'
}

function mouseOverSvgEffect(event: MouseEvent) {
  const elt = event.currentTarget as FigureClicable
  elt.style.border = '3px solid #1DA962'
}

function mouseOutSvgEffect(event: MouseEvent) {
  const elt = event.currentTarget as FigureClicable
  elt.style.border = '3px solid transparent'
}

function mouseSvgClick(event: MouseEvent) {
  const elt = event.currentTarget as FigureClicable
  if (elt.etat) {
    elt.style.border = '3px solid transparent'
    elt.addEventListener('mouseenter', mouseOverSvgEffect)
    elt.addEventListener('mouseleave', mouseOutSvgEffect)
    elt.etat = false
  } else {
    elt.removeEventListener('mouseenter', mouseOverSvgEffect)
    elt.removeEventListener('mouseleave', mouseOutSvgEffect)
    elt.style.border = '3px solid #f15929'
    elt.etat = true
  }
}

function parseFigures(value: string | null): ClickFigures {
  if (value == null || value === '') return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (figure): figure is ClickFigures[number] =>
        typeof figure === 'object' &&
        figure != null &&
        typeof figure.id === 'string' &&
        typeof figure.solution === 'boolean',
    )
  } catch {
    return []
  }
}

function parseCliqueFigureValue(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value !== 'string') return null
  if (value.trim() === '') return []
  try {
    const parsed = JSON.parse(value)
    return parseCliqueFigureValue(parsed)
  } catch {
    return null
  }
}

function documentPositionComparator(
  a: HTMLElement,
  b: HTMLElement,
): 0 | 1 | -1 {
  if (a === b) return 0
  const position = a.compareDocumentPosition(b) as number

  if (
    position & Node.DOCUMENT_POSITION_FOLLOWING ||
    position & Node.DOCUMENT_POSITION_CONTAINED_BY
  ) {
    return -1
  }
  if (
    position & Node.DOCUMENT_POSITION_PRECEDING ||
    position & Node.DOCUMENT_POSITION_CONTAINS
  ) {
    return 1
  }
  return 0
}

registerMathaleaCustomElement(CliqueFigureElement)
