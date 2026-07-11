import GlisseNombreElement from 'glisse-nombre'
import { context } from '../../modules/context'
import MathaleaCustomElement from './MathaleaCustomElement'

if (customElements.get('glisse-nombre') === undefined) {
  customElements.define('glisse-nombre', GlisseNombreElement)
}

export type GlisseNombreWrapperOptions = {
  number?: number
  addZeros?: boolean
  animation?: number
  showCalculus?: boolean
  showComma1?: boolean
  showComma2?: boolean
  initialPower?: number
  removeLeftZeros?: boolean
  interactivityOn?: boolean
}

class GlisseNombreWrapperElement extends MathaleaCustomElement {
  static readonly elementTag = 'mathalea-glisse-nombre'

  static create(options: GlisseNombreWrapperOptions = {}): string {
    if (!context.isHtml) return ''
    return super.create(options)
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render(): string | void {
    if (!context.isHtml) return this.renderLatex()

    this.innerHTML = ''
    const inner = document.createElement('glisse-nombre')

    for (const name of this.getAttributeNames()) {
      if (name === 'interactivity-on') continue
      const attr = this.getAttribute(name)
      if (attr != null) inner.setAttribute(name, attr)
    }

    if (!this.interactivityOn) {
      inner.style.pointerEvents = 'none'
      inner.style.opacity = '0.9'
    }

    this.appendChild(inner)
    return ''
  }

  protected renderLatex(): string {
    return ''
  }

  get value(): unknown {
    const inner = this.querySelector('glisse-nombre') as HTMLElement | null
    if (inner && 'value' in (inner as unknown as Record<string, unknown>)) {
      return (inner as unknown as { value: unknown }).value
    }
    return null
  }

  set value(nextValue: unknown) {
    const inner = this.querySelector('glisse-nombre') as HTMLElement | null
    if (inner && 'value' in (inner as unknown as Record<string, unknown>)) {
      ;(inner as unknown as { value: unknown }).value = nextValue
    }
  }

  protected onInteractivityChanged(isOn: boolean): void {
    const inner = this.querySelector('glisse-nombre') as HTMLElement | null
    if (!inner) return
    inner.style.pointerEvents = isOn ? '' : 'none'
    inner.style.opacity = isOn ? '' : '0.9'
  }
}

if (customElements.get('mathalea-glisse-nombre') === undefined) {
  customElements.define('mathalea-glisse-nombre', GlisseNombreWrapperElement)
}

export default GlisseNombreWrapperElement
