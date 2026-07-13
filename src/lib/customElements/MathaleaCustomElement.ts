import { context } from '../../modules/context'
export const listOfCustomElements = [
  'interactive-clock',
  'multi-mathfield',
  'liste-deroulante',
]

type CreateAttributes = Record<string, unknown>

export default class MathaleaCustomElement extends HTMLElement {
  static readonly elementTag: string = ''

  private _value: unknown = null
  private _interactivityOn = true

  constructor() {
    super()
  }

  /**
   * Génère le HTML de l'élément à injecter dans l'énoncé.
   * Retourne une chaîne vide hors contexte HTML.
   */
  static create(attributes: CreateAttributes = {}): string {
    if (!context.isHtml) return ''
    const tag = (this as typeof MathaleaCustomElement).elementTag
    if (!tag) return ''
    const attrs = this.buildAttributes(attributes)
    return `<${tag}${attrs}></${tag}>`
  }

  protected static buildAttributes(attributes: CreateAttributes): string {
    const parts: string[] = []
    Object.entries(attributes).forEach(([name, rawValue]) => {
      const serialized = this.serializeAttributeValue(rawValue)
      if (serialized == null) return
      const attrName = this.toKebabCase(name)
      parts.push(`${attrName}="${serialized}"`)
    })
    return parts.length > 0 ? ` ${parts.join(' ')}` : ''
  }

  protected static serializeAttributeValue(value: unknown): string | null {
    if (value == null) return null
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'number')
      return Number.isFinite(value) ? `${value}` : null
    if (typeof value === 'string') return this.escapeHtmlAttribute(value)
    if (Array.isArray(value) || typeof value === 'object') {
      return this.escapeHtmlAttribute(JSON.stringify(value))
    }
    return this.escapeHtmlAttribute(String(value))
  }

  protected static toKebabCase(name: string): string {
    return name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  }

  protected static escapeHtmlAttribute(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    this.render()
  }

  disconnectedCallback() {
    // Hook volontairement vide pour les classes filles.
  }

  /**
   * En contexte HTML: met à jour l'affichage du composant.
   * En contexte LaTeX: retourne la représentation LaTeX (ou '').
   */
  render(): string | void {
    if (!context.isHtml) {
      return this.renderLatex()
    }
    return ''
  }

  protected renderLatex(): string {
    return ''
  }

  get value(): unknown {
    return this._value
  }

  set value(nextValue: unknown) {
    this._value = nextValue
  }

  get interactivityOn(): boolean {
    return this._interactivityOn
  }

  set interactivityOn(isOn: boolean) {
    this._interactivityOn = isOn
    this.setAttribute('interactivity-on', isOn ? 'true' : 'false')
    this.onInteractivityChanged(isOn)
  }

  protected onInteractivityChanged(_isOn: boolean): void {
    // Hook pour les classes filles.
  }

  protected hydrateCommonAttributes(): void {
    if (this.hasAttribute('interactivity-on')) {
      this._interactivityOn = this.getAttribute('interactivity-on') !== 'false'
    }
  }
}
