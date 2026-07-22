import { MathfieldElement } from 'mathlive'
import { verifyFillInTheBlankMathLive } from '../interactif/mathLiveVerifications'
import { setMathfield, setMathfieldListener } from '../interactif/setMathfield'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

type PromptState = 'correct' | 'incorrect' | 'undefined' | undefined
type MathfieldCommand = Parameters<MathfieldElement['executeCommand']>[0]

function cleanFillInTheBlanksText(text: string): string {
  if (typeof text !== 'string') return ''
  return text
    .replace(/\\placeholder(\[[^\]]*\])+/g, '')
    .replace(/\{\}/g, '{...}')
}

export type FillInTheBlankVerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export type FillInTheBlankVerificationCallback = (
  exercice: IExercice,
  questionIndex: number,
  fillInTheBlank: FillInTheBlankElement,
) => FillInTheBlankVerificationResult

export type FillInTheBlankOptions = {
  id?: string
  className?: string
  dataKeyboard?: string
  content?: string
  interactivityOn?: boolean
  verifyCallbackName?: string
  verifyCallback?: FillInTheBlankVerificationCallback
}

type FillInTheBlankCreateOptions = FillInTheBlankOptions & {
  numeroExercice: number
  questionIndex: number
}

export class FillInTheBlankElement extends MathaleaCustomElement {
  static readonly elementTag = 'fill-in-the-blank'
  private static readonly verificationCallbacks = new Map<
    string,
    FillInTheBlankVerificationCallback
  >()

  private mathfield: MathfieldElement | null = null
  private attributesObserver: MutationObserver | null = null
  private forwardFocusHandler: (() => void) | null = null

  static create({
    id,
    numeroExercice,
    questionIndex,
    className = 'fillInTheBlanks',
    dataKeyboard = '',
    content = '',
    interactivityOn = true,
    verifyCallbackName,
    verifyCallback,
  }: FillInTheBlankCreateOptions): string {
    const legacyMathfieldId =
      id ?? `champTexteEx${numeroExercice}Q${questionIndex}`
    const computedId = `${FillInTheBlankElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const computedCallbackName =
      verifyCallbackName ??
      (verifyCallback == null ? undefined : `${legacyMathfieldId}-verification`)
    if (verifyCallback != null && computedCallbackName != null) {
      FillInTheBlankElement.registerVerificationCallback(
        computedCallbackName,
        verifyCallback,
      )
    }
    const wrapperAttributes = this.buildAttributes({
      id: computedId,
      mathfieldId: legacyMathfieldId,
      className,
      dataKeyboard,
      interactivityOn,
      verifyCallbackName: computedCallbackName,
    })
    const mathfieldAttributes = this.buildAttributes({
      id: legacyMathfieldId,
      dataKeyboard,
      virtualKeyboardMode: 'manual',
      readonly: true,
      className,
    })
    return `<${FillInTheBlankElement.elementTag}${wrapperAttributes}><math-field${mathfieldAttributes}>${content}</math-field></${FillInTheBlankElement.elementTag}>`
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): FillInTheBlankVerificationResult {
    const id = `champTexteEx${exercice.numeroExercice}Q${i}`
    const fillInTheBlank = document.querySelector(
      `${FillInTheBlankElement.elementTag}[mathfield-id="${id}"]`,
    ) as FillInTheBlankElement | null
    const callbackName = fillInTheBlank?.getAttribute('verify-callback-name')
    const callback =
      callbackName == null
        ? null
        : FillInTheBlankElement.verificationCallbacks.get(callbackName)
    if (fillInTheBlank != null && callback != null) {
      return callback(exercice, i, fillInTheBlank)
    }
    return verifyFillInTheBlankMathLive(
      exercice,
      i,
      fillInTheBlank?.mathfield ?? null,
    )
  }

  static registerVerificationCallback(
    name: string,
    callback: FillInTheBlankVerificationCallback,
  ): void {
    if (name.trim().length === 0) {
      throw new Error(
        'Le nom du vérificateur fill-in-the-blank ne peut pas être vide',
      )
    }
    FillInTheBlankElement.verificationCallbacks.set(name, callback)
  }

  static unregisterVerificationCallback(name: string): void {
    FillInTheBlankElement.verificationCallbacks.delete(name)
  }

  static formatStudentAnswer(rawAnswer: string): string {
    return `$${cleanFillInTheBlanksText(rawAnswer)}$`
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return cleanFillInTheBlanksText(questionHtml)
  }

  render(): string | void {
    const existing = this.querySelector('math-field') as MathfieldElement | null
    this.mathfield = existing ?? new MathfieldElement()
    this.syncMathfieldAttributes()
    if (existing == null) this.appendChild(this.mathfield)
    this.setupMathfield()
    this.observeLegacyAttributes()
  }

  focus(options?: FocusOptions): void {
    void options
    this.mathfield?.focus()
  }

  get value(): string {
    return this.mathfield?.value ?? ''
  }

  set value(nextValue: string) {
    if (this.mathfield != null) this.mathfield.value = nextValue
  }

  get readOnly(): boolean {
    return this.mathfield?.readOnly ?? false
  }

  set readOnly(isReadOnly: boolean) {
    if (this.mathfield != null) this.mathfield.readOnly = isReadOnly
    if (isReadOnly) this.setAttribute('readonly', 'true')
    else this.removeAttribute('readonly')
  }

  getValue(): string {
    return this.mathfield?.getValue() ?? ''
  }

  getPromptValue(id: string): string {
    return this.mathfield?.getPromptValue(id) ?? ''
  }

  setPromptState(id: string, state: PromptState, value: boolean): void {
    this.mathfield?.setPromptState(id, state, value)
  }

  getPrompts(): string[] {
    return this.mathfield?.getPrompts() ?? []
  }

  executeCommand(command: MathfieldCommand): boolean {
    return this.mathfield?.executeCommand(command) ?? false
  }

  protected onInteractivityChanged(isOn: boolean): void {
    this.readOnly = !isOn
  }

  private syncMathfieldAttributes(): void {
    if (this.mathfield == null) return
    this.mathfield.id = this.getAttribute('mathfield-id') ?? this.id
    this.mathfield.setAttribute(
      'data-keyboard',
      this.getAttribute('data-keyboard') ?? '',
    )
    this.mathfield.setAttribute('virtual-keyboard-mode', 'manual')
    this.mathfield.className = [
      this.getAttribute('class-name') ?? 'fillInTheBlanks',
      this.getAttribute('class') ?? '',
    ]
      .join(' ')
      .trim()
    this.mathfield.readOnly = true
  }

  private setupMathfield(): void {
    if (this.mathfield == null) return
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1
    this.forwardFocusHandler ??= () => {
      this.mathfield?.focus()
    }
    this.removeEventListener('focus', this.forwardFocusHandler)
    this.addEventListener('focus', this.forwardFocusHandler)
    this.removeEventListener('click', this.forwardFocusHandler)
    this.addEventListener('click', this.forwardFocusHandler)
    if (this.mathfield.dataset.listenerAdded !== 'true') {
      if (this.mathfield.isConnected) {
        setMathfield(this.mathfield)
      } else {
        this.mathfield.addEventListener('mount', setMathfieldListener, {
          once: true,
        })
      }
    }
  }

  private observeLegacyAttributes(): void {
    this.attributesObserver?.disconnect()
    this.attributesObserver = new MutationObserver(() => {
      this.syncMathfieldAttributes()
    })
    this.attributesObserver.observe(this, {
      attributes: true,
      attributeFilter: ['id', 'mathfield-id', 'class', 'class-name'],
    })
  }

  disconnectedCallback() {
    this.attributesObserver?.disconnect()
    this.attributesObserver = null
    if (this.forwardFocusHandler != null) {
      this.removeEventListener('focus', this.forwardFocusHandler)
      this.removeEventListener('click', this.forwardFocusHandler)
    }
    super.disconnectedCallback()
  }
}

registerMathaleaCustomElement(FillInTheBlankElement)
