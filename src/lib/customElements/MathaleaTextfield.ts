import { verifySingleMathLiveField } from '../interactif/mathLiveVerifications'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type MathaleaTextfieldVerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export type MathaleaTextfieldVerificationCallback = (
  exercice: IExercice,
  questionIndex: number,
  textfield: MathaleaTextfieldElement,
) => MathaleaTextfieldVerificationResult

export type MathaleaTextfieldOptions = {
  id?: string
  className?: string
  dataKeyboard?: string
  espace?: boolean
  placeholder?: string
  readonly?: boolean
  interactivityOn?: boolean
  verifyCallbackName?: string
  verifyCallback?: MathaleaTextfieldVerificationCallback
}

type MathaleaTextfieldCreateOptions = MathaleaTextfieldOptions & {
  numeroExercice: number
  questionIndex: number
}

export class MathaleaTextfieldElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-textfield'
  private static readonly verificationCallbacks = new Map<
    string,
    MathaleaTextfieldVerificationCallback
  >()

  private input: HTMLInputElement | null = null
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
  }: MathaleaTextfieldCreateOptions): string {
    const legacyInputId = id ?? `champTexteEx${numeroExercice}Q${questionIndex}`
    const computedId = `${MathaleaTextfieldElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const computedCallbackName =
      verifyCallbackName ??
      (verifyCallback == null ? undefined : `${legacyInputId}-verification`)
    if (verifyCallback != null && computedCallbackName != null) {
      MathaleaTextfieldElement.registerVerificationCallback(
        computedCallbackName,
        verifyCallback,
      )
    }
    const wrapperAttributes = this.buildAttributes({
      id: computedId,
      inputId: legacyInputId,
      className,
      dataKeyboard,
      dataSpace: espace,
      placeholder,
      readonly: readonly ? true : null,
      interactivityOn,
      verifyCallbackName: computedCallbackName,
    })
    const inputAttributes = this.buildAttributes({
      id: legacyInputId,
      dataKeyboard,
      dataSpace: espace,
      placeholder,
      virtualKeyboardMode: 'manual',
      className,
      readonly: readonly || !interactivityOn ? true : null,
    })
    return `<${MathaleaTextfieldElement.elementTag}${wrapperAttributes}><input${inputAttributes}></input></${MathaleaTextfieldElement.elementTag}>`
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): MathaleaTextfieldVerificationResult {
    const id = `champTexteEx${exercice.numeroExercice}Q${i}`
    const textfield = document.querySelector(
      `${MathaleaTextfieldElement.elementTag}[input-id="${id}"]`,
    ) as MathaleaTextfieldElement | null
    const callbackName = textfield?.getAttribute('verify-callback-name')
    const callback =
      callbackName == null
        ? null
        : MathaleaTextfieldElement.verificationCallbacks.get(callbackName)
    if (textfield != null && callback != null) {
      return callback(exercice, i, textfield)
    }
    return verifySingleMathLiveField(exercice, i, textfield?.input ?? null)
  }

  static registerVerificationCallback(
    name: string,
    callback: MathaleaTextfieldVerificationCallback,
  ): void {
    if (name.trim().length === 0) {
      throw new Error('Le nom du vérificateur texte ne peut pas être vide')
    }
    MathaleaTextfieldElement.verificationCallbacks.set(name, callback)
  }

  static unregisterVerificationCallback(name: string): void {
    MathaleaTextfieldElement.verificationCallbacks.delete(name)
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return questionHtml
      .replace(/<mathalea-textfield[^>]*\/>/gi, ' ... ')
      .replace(
        /<mathalea-textfield[^>]*>[^]*?<\/mathalea-textfield>/gi,
        ' ... ',
      )
  }

  render(): string | void {
    const existing = this.querySelector('input') as HTMLInputElement | null
    this.input = existing ?? document.createElement('input')
    this.syncInputAttributes()
    if (existing == null) this.appendChild(this.input)
    this.setupInput()
    this.observeLegacyAttributes()
  }

  focus(options?: FocusOptions): void {
    this.input?.focus(options)
  }

  get value(): string {
    return this.input?.value ?? ''
  }

  set value(nextValue: string) {
    if (this.input != null) this.input.value = nextValue
  }

  get readOnly(): boolean {
    return this.input?.readOnly ?? false
  }

  set readOnly(isReadOnly: boolean) {
    if (this.input != null) this.input.readOnly = isReadOnly
    if (isReadOnly) this.setAttribute('readonly', 'true')
    else this.removeAttribute('readonly')
  }

  protected onInteractivityChanged(isOn: boolean): void {
    this.readOnly = !isOn
  }

  private syncInputAttributes(): void {
    if (this.input == null) return
    this.input.id = this.getAttribute('input-id') ?? this.id
    this.input.setAttribute(
      'data-keyboard',
      this.getAttribute('data-keyboard') ?? '',
    )
    this.input.setAttribute('virtual-keyboard-mode', 'manual')
    this.input.className = [
      this.getAttribute('class-name') ?? '',
      this.getAttribute('class') ?? '',
    ]
      .join(' ')
      .trim()
    const placeholder = this.getAttribute('placeholder')
    if (placeholder != null && placeholder !== '') {
      this.input.setAttribute('placeholder', placeholder)
    }
    if (this.getAttribute('data-space') === 'true') {
      this.input.setAttribute('data-space', 'true')
    }
    this.input.readOnly =
      this.getAttribute('readonly') === 'true' || !this.interactivityOn
  }

  private setupInput(): void {
    if (this.input == null) return
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1
    this.forwardFocusHandler ??= () => {
      this.input?.focus()
    }
    this.removeEventListener('focus', this.forwardFocusHandler)
    this.addEventListener('focus', this.forwardFocusHandler)
    this.removeEventListener('click', this.forwardFocusHandler)
    this.addEventListener('click', this.forwardFocusHandler)
  }

  private observeLegacyAttributes(): void {
    this.attributesObserver?.disconnect()
    this.attributesObserver = new MutationObserver(() => {
      this.syncInputAttributes()
    })
    this.attributesObserver.observe(this, {
      attributes: true,
      attributeFilter: [
        'id',
        'input-id',
        'class',
        'class-name',
        'readonly',
        'placeholder',
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

registerMathaleaCustomElement(MathaleaTextfieldElement)
