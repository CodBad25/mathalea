import { context } from '../../modules/context'
import type { IExercice } from '../types'
import {
  attachDragAndDropListeners,
  type DragAndDropListenerRecord,
  verifDragAndDrop,
} from '../interactif/DragAndDrop'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type DragAndDropElementOptions = {
  id?: string
  numeroExercice: number
  questionIndex: number
  innerHtml?: string
  interactivityOn?: boolean
}

export class DragAndDropElement extends MathaleaCustomElement {
  static readonly elementTag = 'drag-and-drop'

  private listeners: DragAndDropListenerRecord[] = []

  static create({
    id,
    numeroExercice,
    questionIndex,
    innerHtml = '',
    interactivityOn = true,
  }: DragAndDropElementOptions): string {
    if (!context.isHtml) return ''
    const elementId =
      id ??
      `${DragAndDropElement.elementTag}Ex${numeroExercice}Q${questionIndex}`
    return `<${DragAndDropElement.elementTag} id="${elementId}" numero-exercice="${numeroExercice}" question-index="${questionIndex}" interactivity-on="${interactivityOn ? 'true' : 'false'}">${innerHtml}</${DragAndDropElement.elementTag}>`
  }

  static verifQuestion(
    exercice: IExercice,
    questionIndex: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    const result = verifDragAndDrop(exercice, questionIndex)
    const element = document.querySelector(
      `#${DragAndDropElement.elementTag}Ex${exercice.numeroExercice}Q${questionIndex}`,
    ) as DragAndDropElement | null
    if (element != null) element.interactivityOn = false
    return result
  }

  connectedCallback(): void {
    this.hydrateCommonAttributes()
    if (this.interactivityOn) this.attachListeners()
    else this.updateInteractiveState(false)
  }

  disconnectedCallback(): void {
    this.detachListeners()
  }

  get value(): string {
    const questionIndex = Number(this.getAttribute('question-index') ?? 0)
    const numeroExercice = Number(this.getAttribute('numero-exercice') ?? 0)
    const rectangles = this.querySelectorAll<HTMLElement>(
      `#rectanglesEx${numeroExercice}Q${questionIndex} .rectangleDND`,
    )
    return JSON.stringify(
      Array.from(rectangles).map((rectangle) =>
        Array.from(rectangle.querySelectorAll<HTMLElement>('.etiquette'))
          .map((etiquette) => etiquette.id)
          .join(';'),
      ),
    )
  }

  set value(_nextValue: string) {
    // La restauration historique des réponses DnD passe par les ids rectangleDND...
    // stockés par verifDragAndDrop().
  }

  protected onInteractivityChanged(isOn: boolean): void {
    if (isOn) this.attachListeners()
    else this.detachListeners()
    this.updateInteractiveState(isOn)
  }

  private attachListeners(): void {
    this.detachListeners()
    const numeroExercice = Number(this.getAttribute('numero-exercice') ?? 0)
    const questionIndex = Number(this.getAttribute('question-index') ?? 0)
    this.listeners = attachDragAndDropListeners({
      root: this,
      numeroExercice,
      question: questionIndex,
    })
  }

  private detachListeners(): void {
    for (const { element, type, listener, options } of this.listeners) {
      element.removeEventListener(type, listener, options)
    }
    this.listeners = []
  }

  private updateInteractiveState(isOn: boolean): void {
    this.querySelectorAll<HTMLElement>('.etiquette').forEach((etiquette) => {
      etiquette.draggable = isOn && etiquette.classList.contains('dragOk')
      etiquette.classList.toggle('noDrag', !isOn)
    })
  }
}

registerMathaleaCustomElement(DragAndDropElement)
