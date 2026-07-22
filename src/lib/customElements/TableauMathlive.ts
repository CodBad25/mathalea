import { verifyTableauMathLive } from '../interactif/mathLiveVerifications'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type TableauMathliveVerificationResult = {
  isOk: boolean
  feedback: string
  score: { nbBonnesReponses: number; nbReponses: number }
}

export type TableauMathliveVerificationCallback = (
  exercice: IExercice,
  questionIndex: number,
  tableau: TableauMathliveElement,
) => TableauMathliveVerificationResult

export type TableauMathliveOptions = {
  tableHtml: string
  feedbackHtml?: string
  id?: string
  tableId?: string
  interactivityOn?: boolean
  verifyCallbackName?: string
  verifyCallback?: TableauMathliveVerificationCallback
}

type TableauMathliveCreateOptions = TableauMathliveOptions & {
  numeroExercice: number
  questionIndex: number
}

export class TableauMathliveElement extends MathaleaCustomElement {
  static readonly elementTag = 'tableau-mathlive'
  private static readonly verificationCallbacks = new Map<
    string,
    TableauMathliveVerificationCallback
  >()

  static create({
    id,
    tableId,
    tableHtml,
    feedbackHtml = '',
    numeroExercice,
    questionIndex,
    interactivityOn = true,
    verifyCallbackName,
    verifyCallback,
  }: TableauMathliveCreateOptions): string {
    const legacyTableId =
      tableId ?? `tabMathliveEx${numeroExercice}Q${questionIndex}`
    const computedId =
      id ??
      `${TableauMathliveElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    const computedCallbackName =
      verifyCallbackName ??
      (verifyCallback == null ? undefined : `${legacyTableId}-verification`)
    if (verifyCallback != null && computedCallbackName != null) {
      TableauMathliveElement.registerVerificationCallback(
        computedCallbackName,
        verifyCallback,
      )
    }
    const wrapperAttributes = this.buildAttributes({
      id: computedId,
      tableId: legacyTableId,
      interactivityOn,
      verifyCallbackName: computedCallbackName,
    })
    return `<${TableauMathliveElement.elementTag}${wrapperAttributes}>${tableHtml}${feedbackHtml}</${TableauMathliveElement.elementTag}>`
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): TableauMathliveVerificationResult {
    const id = `tabMathliveEx${exercice.numeroExercice}Q${i}`
    const tableau = document.querySelector(
      `${TableauMathliveElement.elementTag}[table-id="${id}"]`,
    ) as TableauMathliveElement | null
    const callbackName = tableau?.getAttribute('verify-callback-name')
    const callback =
      callbackName == null
        ? null
        : TableauMathliveElement.verificationCallbacks.get(callbackName)
    if (tableau != null && callback != null) {
      return callback(exercice, i, tableau)
    }
    return verifyTableauMathLive(
      exercice,
      i,
      tableau?.querySelector('table') ?? null,
    )
  }

  static registerVerificationCallback(
    name: string,
    callback: TableauMathliveVerificationCallback,
  ): void {
    if (name.trim().length === 0) {
      throw new Error(
        'Le nom du vérificateur tableau-mathlive ne peut pas être vide',
      )
    }
    TableauMathliveElement.verificationCallbacks.set(name, callback)
  }

  static unregisterVerificationCallback(name: string): void {
    TableauMathliveElement.verificationCallbacks.delete(name)
  }

  get value(): Record<string, string> {
    const values: Record<string, string> = {}
    const fields = this.querySelectorAll('math-field[id^="champTexteEx"]')
    fields.forEach((field) => {
      const mathfield = field as { id?: string; value?: string }
      if (mathfield.id != null) values[mathfield.id] = mathfield.value ?? ''
    })
    return values
  }

  set value(nextValue: Record<string, string>) {
    Object.entries(nextValue).forEach(([id, value]) => {
      const field = this.querySelector(`#${CSS.escape(id)}`) as
        | { value?: string }
        | null
      if (field != null) field.value = value
    })
  }

  protected onInteractivityChanged(isOn: boolean): void {
    const fields = this.querySelectorAll('math-field')
    fields.forEach((field) => {
      const mathfield = field as { readOnly?: boolean }
      mathfield.readOnly = !isOn
    })
  }
}

registerMathaleaCustomElement(TableauMathliveElement)
