import { compile } from '@cortex-js/compute-engine'
import { MathfieldElement } from 'mathlive'
import { context } from '../../modules/context'
import { bleuMathalea } from '../colors'
import { isEquivalentEquation } from '../interactif/checks/equationChecks'
import {
  isEquivalentInequality,
  splitInequality,
} from '../interactif/checks/inequalityChecks'
import { fonctionComparaison } from '../interactif/comparisonFunctions'
import { setMathfield, setMathfieldListener } from '../interactif/setMathfield'
import type { IExercice } from '../types'
import {
  IntervalleDroiteElement,
  type IntervalleDroiteValue,
} from './IntervalleDroiteElement'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type SolveurKind = 'equation' | 'inequation'
export type SolveurMode = 'entrainement' | 'evaluation'

export type MathaleaSolveurOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  initial: string
  kind?: SolveurKind
  mode?: SolveurMode
  variable?: string
  showInterval?: boolean
  intervalMin?: number
  intervalMax?: number
  interactivityOn?: boolean
}

type VerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

/**
 * @author Jean-Claude Lhote
 */
export class MathaleaSolveurElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-solveur'
  private lines: string[] = []
  private invalidLineIndexes = new Set<number>()
  private message = ''
  private messageIsSuccess = false
  // Élément créé sans interactivité (ex : correction CAN) : seule l'équation est affichée.
  private equationOnly = false

  static create({
    id,
    numeroExercice,
    questionIndex,
    initial,
    kind = 'equation',
    mode = 'entrainement',
    variable = 'x',
    showInterval = false,
    intervalMin = -5,
    intervalMax = 5,
    interactivityOn = true,
  }: MathaleaSolveurOptions): string {
    // Hors interactivité (ou hors HTML), seule l'équation est écrite.
    if (!context.isHtml || context.isTypst || !interactivityOn)
      return `$${initial}$`
    return super.create({
      id:
        id ??
        `${MathaleaSolveurElement.elementTag}Ex${numeroExercice ?? 0}Q${questionIndex ?? 0}`,
      numeroExercice: numeroExercice ?? 0,
      questionIndex: questionIndex ?? 0,
      initial,
      kind,
      mode,
      variable,
      showInterval,
      intervalMin,
      intervalMax,
      interactivityOn,
    })
  }

  connectedCallback(): void {
    if (this.getAttribute('interactivity-on') === 'false')
      this.equationOnly = this.lines.length === 0
    if (this.lines.length === 0)
      this.lines = [this.getAttribute('initial') ?? '', '']
    super.connectedCallback()
  }

  disconnectedCallback(): void {
    this.replaceChildren()
  }

  static formatStudentAnswer(rawAnswer: string): string {
    return rawAnswer === '' ? 'aucune réponse' : `$${rawAnswer}$`
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): VerificationResult {
    const element = document.getElementById(
      `${this.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`,
    ) as MathaleaSolveurElement | null
    const actual = element?.value ?? ''
    const expected =
      exercice.autoCorrection[questionIndex]?.valeur?.reponse?.value
    const expectedValues = Array.isArray(expected)
      ? expected.map(String)
      : [String(expected ?? '')]
    const isOk = expectedValues.some((candidate) =>
      isConformToExpected(actual, candidate, element?.kind ?? 'equation'),
    )
    const feedback = isOk
      ? ''
      : element?.kind === 'inequation'
        ? "La dernière inéquation n'est pas la solution attendue."
        : "La dernière équation n'est pas la solution attendue."

    exercice.answers ??= {}
    if (element != null) {
      exercice.answers[element.id] = actual
      element.message = feedback
      element.messageIsSuccess = isOk
      element.interactivityOn = false
    }
    updateExternalFeedback(exercice, questionIndex, isOk, feedback)
    return {
      isOk,
      feedback,
      score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
    }
  }

  get kind(): SolveurKind {
    return this.getAttribute('kind') === 'inequation'
      ? 'inequation'
      : 'equation'
  }

  get mode(): SolveurMode {
    return this.getAttribute('mode') === 'evaluation'
      ? 'evaluation'
      : 'entrainement'
  }

  get value(): string {
    return (
      [...this.lines]
        .map((line, index) => ({ line, index }))
        .reverse()
        .find(
          ({ line, index }) =>
            index > 0 &&
            line.trim() !== '' &&
            !this.invalidLineIndexes.has(index),
        )?.line ?? ''
    )
  }

  set value(nextValue: string) {
    const initial = this.getAttribute('initial') ?? ''
    this.invalidLineIndexes.clear()
    this.lines = nextValue.trim() === '' ? [initial, ''] : [initial, nextValue]
    this.render()
  }

  render(): string | void {
    if (this.equationOnly) {
      this.innerHTML = `<span class="solver-equation">$${this.getAttribute('initial') ?? ''}$</span>`
      return
    }
    const numeroExercice = this.getAttribute('numero-exercice') ?? '0'
    const questionIndex = this.getAttribute('question-index') ?? '0'
    const editableIndex = this.lines.length - 1
    let stepNumber = 1
    const rows = this.lines
      .map((line, index) => {
        const editable =
          this.interactivityOn && index === editableIndex && index > 0
        const invalid = this.invalidLineIndexes.has(index)
        const label = index === 0 ? 'Énoncé' : `Étape ${stepNumber}`
        if (index > 0 && !invalid && line.trim() !== '') stepNumber++
        return `<div class="line${invalid ? ' invalid' : ''}"><span class="step">${label}</span><span class="solver-field" data-index="${index}"></span>${invalid ? '<span class="line-status">Étape incorrecte</span>' : editable ? '<button class="evaluate" type="button">Évaluer</button>' : ''}</div>`
      })
      .join('')
    this.innerHTML = `
      <style>
        mathalea-solveur { display: block; margin: .6rem 0; max-width: 760px; }
        mathalea-solveur .solver { display: grid; gap: .45rem; }
        mathalea-solveur .line { display: grid; grid-template-columns: 5.5rem minmax(12rem, 1fr) auto; align-items: center; gap: .55rem; }
        mathalea-solveur .step { color: ${bleuMathalea}; font-size: .82rem; font-weight: 600; }
        mathalea-solveur .solver-field { display: block; min-width: 0; margin: 0; padding: 0; border: 0; background: transparent; }
        mathalea-solveur math-field { display: block !important; width: 100%; min-height: 2.75rem; margin: 0 !important; padding: 0; box-sizing: border-box; }
        mathalea-solveur math-field::part(container) { border: none !important; }
        mathalea-solveur math-field:not(.solver-readonly) { border: 1px solid #aab2bd !important; border-radius: .35rem; }
        mathalea-solveur math-field:not(.solver-readonly):focus-within { border-color: transparent !important; }
        mathalea-solveur math-field.solver-readonly::part(container) { border: none !important; outline: none !important; box-shadow: none !important; background: transparent; }
        mathalea-solveur .line.invalid math-field { color: #b42318; }
        mathalea-solveur .line.invalid math-field::part(container) { border: none; background: transparent; }
        mathalea-solveur .line.invalid .step, mathalea-solveur .line-status { color: #b42318; }
        mathalea-solveur .line-status { font-size: .8rem; font-weight: 600; }
        mathalea-solveur button { border: 1px solid ${bleuMathalea}; border-radius: .35rem; background: transparent; color: ${bleuMathalea}; cursor: pointer; padding: .4rem .7rem; font: inherit; }
        mathalea-solveur button:hover, mathalea-solveur button:focus-visible { background: ${bleuMathalea}12; }
        mathalea-solveur .message { margin: .1rem 0 0 6.05rem; font-size: .9rem; }
        mathalea-solveur .message.ok { color: #16803c; }
        mathalea-solveur .message.ko { color: #b42318; }
        mathalea-solveur .interval { margin-left: 6.05rem; }
        @media (max-width: 520px) { mathalea-solveur .line { grid-template-columns: 1fr auto; } mathalea-solveur .step { grid-column: 1 / -1; } mathalea-solveur .message, mathalea-solveur .interval { margin-left: 0; } }
      </style>
      <div class="solver">${rows}</div>
      <p class="message ${this.messageIsSuccess ? 'ok' : 'ko'}" role="status">${this.message}</p>
      <div class="interval"></div>
      <span id="resultatCheckEx${numeroExercice}Q${questionIndex}"></span>
      <div id="feedbackEx${numeroExercice}Q${questionIndex}"></div>`

    this.lines.forEach((line, index) => {
      const host = this.querySelector<HTMLElement>(
        `.solver-field[data-index="${index}"]`,
      )
      if (host == null) return
      const field = new MathfieldElement()
      field.id = `${this.id}-line-${index}`
      field.id = `${this.id}-line-${index}`
      field.value = line
      const editable =
        this.interactivityOn && index === editableIndex && index > 0
      field.readOnly = !editable
      field.classList.toggle('solver-readonly', !editable)
      field.setAttribute('virtual-keyboard-mode', 'manual')

      // Clavier de base avec fractions, où la touche π est remplacée par la
      // lettre de l'inconnue.
      field.setAttribute(
        'data-keyboard',
        this.kind === 'inequation'
          ? 'numbersInconnue basicOperations compare'
          : 'numbersInconnue basicOperations2',
      )
      field.dataset.inconnue = this.getAttribute('variable') ?? 'x'
      field.setAttribute(
        'aria-label',
        index === 0 ? 'Équation de départ' : `Étape ${index}`,
      )
      if (editable) {
        field.addEventListener('input', () => {
          this.lines[index] = field.value
          this.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
      host.appendChild(field)
      if (field.isConnected) {
        setMathfield(field)
      } else {
        field.addEventListener('mount', setMathfieldListener, { once: true })
      }
      if (field.isConnected) {
        setMathfield(field)
      } else {
        field.addEventListener('mount', setMathfieldListener, { once: true })
      }
    })
    this.querySelector('.evaluate')?.addEventListener('click', () =>
      this.evaluate(),
    )
    this.renderInterval()
  }

  protected onInteractivityChanged(): void {
    this.render()
  }

  evaluate(): void {
    this.evaluateCurrentLine()
  }

  private compare(
    input: string,
    expected: string,
  ): { passed: boolean; feedbackKo: string; feedbackOk?: string } {
    return this.kind === 'inequation'
      ? isEquivalentInequality().run(input, expected)
      : isEquivalentEquation().run(
          normalizeEquationVariable(
            input,
            this.getAttribute('variable') ?? 'x',
          ),
          normalizeEquationVariable(
            expected,
            this.getAttribute('variable') ?? 'x',
          ),
        )
  }

  private evaluateCurrentLine(): void {
    const index = this.lines.length - 1
    const current = this.lines[index]?.trim() ?? ''
    const previous = this.findPreviousValidLine(index)
    if (current === '') {
      this.message = 'Saisir une nouvelle ligne avant de l’évaluer.'
      this.messageIsSuccess = false
      this.render()
      return
    }
    const result = this.compare(current, previous)
    this.message = result.passed
      ? (result.feedbackOk ?? 'Transformation correcte.')
      : result.feedbackKo
    this.messageIsSuccess = result.passed
    if (result.passed) {
      if (
        isSolvedForm(current, this.kind, this.getAttribute('variable') ?? 'x')
      ) {
        this.message =
          this.kind === 'inequation'
            ? "L'inéquation est résolue."
            : "L'équation est résolue."
        this.interactivityOn = false
      } else {
        this.lines.push('')
        this.render()
      }
    } else if (this.mode === 'evaluation') this.interactivityOn = false
    else {
      this.invalidLineIndexes.add(index)
      this.lines.push('')
      this.render()
    }
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  private findPreviousValidLine(beforeIndex: number): string {
    for (let index = beforeIndex - 1; index >= 0; index--) {
      if (
        !this.invalidLineIndexes.has(index) &&
        this.lines[index]?.trim() !== ''
      ) {
        return this.lines[index]
      }
    }
    return this.getAttribute('initial') ?? ''
  }

  private renderInterval(): void {
    const host = this.querySelector<HTMLElement>('.interval')
    if (
      host == null ||
      this.getAttribute('show-interval') !== 'true' ||
      this.kind !== 'inequation'
    )
      return
    const value = inequalityToInterval(
      this.value,
      this.getAttribute('variable') ?? 'x',
      this.numberAttribute('interval-min', -5),
      this.numberAttribute('interval-max', 5),
    )
    if (value == null) return
    const interval = new IntervalleDroiteElement()
    interval.setAttribute(
      'min',
      String(this.numberAttribute('interval-min', -5)),
    )
    interval.setAttribute(
      'max',
      String(this.numberAttribute('interval-max', 5)),
    )
    interval.interactivityOn = false
    host.appendChild(interval)
    interval.value = JSON.stringify(value)
  }

  private numberAttribute(name: string, fallback: number): number {
    const value = Number(this.getAttribute(name))
    return Number.isFinite(value) ? value : fallback
  }
}

/**
 * Remplace l'inconnue par `x` sans toucher aux commandes LaTeX
 * (ex : le `s` de `\\times` quand l'inconnue est `s`).
 */
function normalizeEquationVariable(equation: string, variable: string): string {
  if (variable === 'x' || variable === '') return equation
  const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return equation.replace(
    new RegExp(`\\\\[a-zA-Z]+|${escaped}`, 'g'),
    (token) => (token === variable ? 'x' : token),
  )
}

function isSolvedForm(
  value: string,
  kind: SolveurKind,
  variable: string,
): boolean {
  const relation =
    kind === 'inequation' ? splitInequality(value) : splitEquation(value)
  if (relation == null) return false
  return (
    (isVariableAlone(relation.left, variable) &&
      !containsVariable(relation.right, variable)) ||
    (isVariableAlone(relation.right, variable) &&
      !containsVariable(relation.left, variable))
  )
}

function splitEquation(
  value: string,
): { left: string; right: string } | undefined {
  const parts = value.split('=')
  if (parts.length !== 2 || parts.some((part) => part.trim() === ''))
    return undefined
  return { left: parts[0], right: parts[1] }
}

function isVariableAlone(expression: string, variable: string): boolean {
  return normalizedVariableExpression(expression) === variable
}

function containsVariable(expression: string, variable: string): boolean {
  return normalizedVariableExpression(expression).includes(variable)
}

function normalizedVariableExpression(expression: string): string {
  return expression
    .replaceAll('\\left', '')
    .replaceAll('\\right', '')
    .replace(/\\[a-z]+/gi, '')
    .replace(/[{}\s]/g, '')
}

function inequalityToInterval(
  raw: string,
  variable: string,
  min: number,
  max: number,
): IntervalleDroiteValue | null {
  const inequality = splitInequality(raw)
  if (inequality == null) return null
  let relation = inequality.relation
  let boundaryExpression: string
  if (inequality.left.trim() === variable) boundaryExpression = inequality.right
  else if (inequality.right.trim() === variable) {
    boundaryExpression = inequality.left
    relation = ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as const)[
      relation
    ]
  } else return null
  const compiled = compile(boundaryExpression)
  let result: unknown
  try {
    result = compiled?.run?.({})
  } catch {
    return null
  }
  if (
    typeof result !== 'number' ||
    !Number.isFinite(result) ||
    result <= min ||
    result >= max
  )
    return null
  if (relation === '<' || relation === '<=') {
    return {
      start: min,
      end: result,
      leftBracket: null,
      rightBracket: relation === '<' ? '[' : ']',
    }
  }
  return {
    start: result,
    end: max,
    leftBracket: relation === '>' ? ']' : '[',
    rightBracket: null,
  }
}

function isConformToExpected(
  input: string,
  expected: string,
  kind: SolveurKind,
): boolean {
  if (input.trim() === '' || expected.trim() === '') return false
  if (kind === 'equation') {
    const inputParts = input.split('=')
    const expectedParts = expected.split('=')
    if (inputParts.length !== 2 || expectedParts.length !== 2) return false
    return (
      (sameExpression(inputParts[0], expectedParts[0]) &&
        sameExpression(inputParts[1], expectedParts[1])) ||
      (sameExpression(inputParts[0], expectedParts[1]) &&
        sameExpression(inputParts[1], expectedParts[0]))
    )
  }

  const parsedInput = splitInequality(input)
  const parsedExpected = splitInequality(expected)
  if (parsedInput == null || parsedExpected == null) return false
  const sameOrder =
    parsedInput.relation === parsedExpected.relation &&
    sameExpression(parsedInput.left, parsedExpected.left) &&
    sameExpression(parsedInput.right, parsedExpected.right)
  const reversedRelation = (
    { '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as const
  )[parsedExpected.relation]
  const reverseOrder =
    parsedInput.relation === reversedRelation &&
    sameExpression(parsedInput.left, parsedExpected.right) &&
    sameExpression(parsedInput.right, parsedExpected.left)
  return sameOrder || reverseOrder
}

function sameExpression(left: string, right: string): boolean {
  return fonctionComparaison(left.trim(), right.trim()).isOk
}

function updateExternalFeedback(
  exercice: IExercice,
  questionIndex: number,
  isOk: boolean,
  feedback: string,
): void {
  const result = document.getElementById(
    `resultatCheckEx${exercice.numeroExercice}Q${questionIndex}`,
  )
  if (result != null) {
    result.innerHTML = isOk ? '😎' : '☹️'
    result.style.fontSize = 'large'
  }
  const feedbackElement = document.getElementById(
    `feedbackEx${exercice.numeroExercice}Q${questionIndex}`,
  )
  if (feedbackElement != null) feedbackElement.innerHTML = feedback
}

export function addMathaleaSolveur(
  exercice: IExercice,
  questionIndex: number,
  options: Omit<MathaleaSolveurOptions, 'numeroExercice' | 'questionIndex'>,
): string {
  exercice.autoCorrection[questionIndex] ??= {}
  exercice.autoCorrection[questionIndex].formatInteractif =
    MathaleaSolveurElement.elementTag
  return MathaleaSolveurElement.create({
    ...options,
    interactivityOn: options.interactivityOn ?? Boolean(exercice.interactif),
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}

registerMathaleaCustomElement(MathaleaSolveurElement)

export default MathaleaSolveurElement
