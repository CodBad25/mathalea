import { MathfieldElement } from 'mathlive'
import { verifySingleMathLiveField } from '../interactif/mathLiveVerifications'
import { setMathfield, setMathfieldListener } from '../interactif/setMathfield'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

type PromptState = 'correct' | 'incorrect' | 'undefined' | undefined
type MathfieldCommand = Parameters<MathfieldElement['executeCommand']>[0]

export type MathaleaMathfieldVerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export type MathaleaMathfieldVerificationCallback = (
  exercice: IExercice,
  questionIndex: number,
  mathfield: MathaleaMathfieldElement,
) => MathaleaMathfieldVerificationResult

export type MathaleaMathfieldOptions = {
  id?: string
  className?: string
  dataKeyboard?: string
  espace?: boolean
  placeholder?: string
  readonly?: boolean
  interactivityOn?: boolean
  verifyCallbackName?: string
  verifyCallback?: MathaleaMathfieldVerificationCallback
}

type MathaleaMathfieldCreateOptions = MathaleaMathfieldOptions & {
  numeroExercice: number
  questionIndex: number
}

export class MathaleaMathfieldElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-mathfield'
  private static readonly verificationCallbacks = new Map<
    string,
    MathaleaMathfieldVerificationCallback
  >()

  private mathfield: MathfieldElement | null = null
  private attributesObserver: MutationObserver | null = null
  private forwardFocusHandler: (() => void) | null = null

  static create({
    id,
    numeroExercice,
    questionIndex,
    className = '',
    dataKeyboard = '',
    espace = false,
    placeholder = '',
    readonly = false,
    interactivityOn = true,
    verifyCallbackName,
    verifyCallback,
  }: MathaleaMathfieldCreateOptions): string {
    const legacyMathfieldId =
      id ?? `champTexteEx${numeroExercice}Q${questionIndex}`
    const computedId = `${MathaleaMathfieldElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const computedCallbackName =
      verifyCallbackName ??
      (verifyCallback == null ? undefined : `${legacyMathfieldId}-verification`)
    if (verifyCallback != null && computedCallbackName != null) {
      MathaleaMathfieldElement.registerVerificationCallback(
        computedCallbackName,
        verifyCallback,
      )
    }
    return super.create({
      id: computedId,
      mathfieldId: legacyMathfieldId,
      className,
      dataKeyboard,
      dataSpace: espace,
      placeholder,
      readonly: readonly ? true : null,
      interactivityOn,
      verifyCallbackName: computedCallbackName,
    })
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): MathaleaMathfieldVerificationResult {
    const id = `champTexteEx${exercice.numeroExercice}Q${i}`
    const mathfield = document.querySelector(
      `${MathaleaMathfieldElement.elementTag}[mathfield-id="${id}"]`,
    ) as MathaleaMathfieldElement | null
    const callbackName = mathfield?.getAttribute('verify-callback-name')
    const callback =
      callbackName == null
        ? null
        : MathaleaMathfieldElement.verificationCallbacks.get(callbackName)
    if (mathfield != null && callback != null) {
      return callback(exercice, i, mathfield)
    }
    return verifySingleMathLiveField(exercice, i, mathfield?.mathfield ?? null)
  }

  static registerVerificationCallback(
    name: string,
    callback: MathaleaMathfieldVerificationCallback,
  ): void {
    if (name.trim().length === 0) {
      throw new Error('Le nom du vérificateur MathLive ne peut pas être vide')
    }
    MathaleaMathfieldElement.verificationCallbacks.set(name, callback)
  }

  static unregisterVerificationCallback(name: string): void {
    MathaleaMathfieldElement.verificationCallbacks.delete(name)
  }

  static formatStudentAnswer(rawAnswer: string): string {
    return `$${rawAnswer}$`
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return questionHtml
      .replace(/<mathalea-mathfield[^>]*\/>/gi, ' ... ')
      .replace(
        /<mathalea-mathfield[^>]*>[^]*?<\/mathalea-mathfield>/gi,
        ' ... ',
      )
  }

  connectedCallback() {
    super.connectedCallback()
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
      this.getAttribute('class-name') ?? '',
      this.getAttribute('class') ?? '',
    ]
      .join(' ')
      .trim()
    const placeholder = this.getAttribute('placeholder')
    if (placeholder != null && placeholder !== '') {
      this.mathfield.setAttribute('placeholder', placeholder)
    }
    if (this.getAttribute('data-space') === 'true') {
      this.mathfield.setAttribute('data-space', 'true')
    }
    this.mathfield.readOnly =
      this.getAttribute('readonly') === 'true' || !this.interactivityOn
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
      attributeFilter: [
        'id',
        'mathfield-id',
        'class',
        'class-name',
        'readonly',
      ],
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

registerMathaleaCustomElement(MathaleaMathfieldElement)
