import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

export type DomReadyActionContext<TPayload = unknown> = {
  element: DomReadyActionElement
  payload: TPayload
}

export type DomReadyActionCallback<TPayload = unknown> = (
  context: DomReadyActionContext<TPayload>,
) => void | (() => void)

export class DomReadyActionElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-dom-ready'
  private static readonly callbacks = new Map<string, DomReadyActionCallback>()
  private cleanup: (() => void) | null = null

  static create({
    id,
    action,
    payload,
  }: {
    id?: string
    action: string
    payload?: unknown
  }): string {
    return super.create({ id, action, payload })
  }

  static registerCallback<TPayload>(
    action: string,
    callback: DomReadyActionCallback<TPayload>,
  ): void {
    DomReadyActionElement.callbacks.set(
      action,
      callback as DomReadyActionCallback,
    )
  }

  static unregisterCallback(action: string): void {
    DomReadyActionElement.callbacks.delete(action)
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    window.requestAnimationFrame(() => {
      if (!this.isConnected) return
      const action = this.getAttribute('action') ?? ''
      const callback = DomReadyActionElement.callbacks.get(action)
      if (!callback) return
      this.cleanup?.()
      this.cleanup =
        callback({
          element: this,
          payload: this.readPayload(),
        }) ?? null
    })
  }

  disconnectedCallback() {
    this.cleanup?.()
    this.cleanup = null
    super.disconnectedCallback()
  }

  private readPayload(): unknown {
    const raw = this.getAttribute('payload')
    if (!raw) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
}

registerMathaleaCustomElement(DomReadyActionElement)
