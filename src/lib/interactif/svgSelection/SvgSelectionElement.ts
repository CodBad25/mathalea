class SvgSelectionElement extends HTMLElement {
  private _svgs: string[] = []
  private _selectedIndices: Set<number> = new Set()
  private _updatingValueAttr = false

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static get observedAttributes() {
    return ['svgs', 'value', 'disabled']
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return
    if (name === 'svgs') {
      this._svgs = this.parseSvgsAttribute(newValue)
      this.render()
      return
    }
    if (name === 'value' && !this._updatingValueAttr) {
      this._selectedIndices = this.decodeValue(Number(newValue))
      this.updateSelectionState()
      return
    }
    if (name === 'disabled') {
      this.updateDisabledState()
    }
  }

  connectedCallback() {
    this.hydrateFromAttributes()
    this.render()
  }

  set svgs(val: string[]) {
    this._svgs = Array.isArray(val) ? val : []
    this.render()
  }

  get svgs(): string[] {
    return this._svgs
  }

  set value(val: number) {
    if (!Number.isFinite(val) || val < 0) return
    this._selectedIndices = this.decodeValue(val)
    this.syncValueAttribute()
    this.updateSelectionState()
  }

  get value(): number {
    return this.encodeValue(this._selectedIndices)
  }

  private hydrateFromAttributes() {
    if (this.hasAttribute('svgs')) {
      this._svgs = this.parseSvgsAttribute(this.getAttribute('svgs'))
    }
    if (this.hasAttribute('value')) {
      const val = Number(this.getAttribute('value'))
      if (Number.isFinite(val)) {
        this._selectedIndices = this.decodeValue(val)
      }
    }
  }

  private parseSvgsAttribute(value: string | null): string[] {
    if (!value) return []
    try {
      const decoded = decodeURIComponent(value)
      const parsed = JSON.parse(decoded)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.map(String) : []
      } catch {
        return []
      }
    }
  }

  /**
   * Encode un ensemble d'indices en un nombre unique en base n
   * @param indices - Set d'indices à encoder
   * @returns Nombre représentant la sélection (sum of n^i for each selected index i)
   */
  private encodeValue(indices: Set<number>): number {
    if (this._svgs.length === 0 || indices.size === 0) return 0
    const n = this._svgs.length
    let value = 0
    indices.forEach((index) => {
      if (index >= 0 && index < n) {
        value += Math.pow(n, index)
      }
    })
    return value
  }

  /**
   * Décode un nombre en un ensemble d'indices sélectionnés
   * @param value - Nombre à décoder
   * @returns Set d'indices correspondants
   */
  private decodeValue(value: number): Set<number> {
    const indices = new Set<number>()
    if (this._svgs.length === 0 || value === 0) return indices
    const n = this._svgs.length
    let remaining = value
    let index = 0
    while (remaining > 0 && index < this._svgs.length) {
      const power = Math.pow(n, index)
      if (remaining >= power) {
        indices.add(index)
        remaining -= power
      }
      index++
    }
    return indices
  }

  private syncValueAttribute() {
    if (!this.isConnected) return
    this._updatingValueAttr = true
    this.setAttribute('value', String(this.value))
    this._updatingValueAttr = false
  }

  private updateSelectionState() {
    if (!this.shadowRoot) return
    const buttons = Array.from(
      this.shadowRoot.querySelectorAll<HTMLButtonElement>('button[data-index]'),
    )
    for (const button of buttons) {
      const index = Number(button.dataset.index)
      const isSelected = this._selectedIndices.has(index)
      button.classList.toggle('is-selected', isSelected)
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    }
  }

  private updateDisabledState() {
    if (!this.shadowRoot) return
    const disabled = this.hasAttribute('disabled')
    const buttons = Array.from(
      this.shadowRoot.querySelectorAll<HTMLButtonElement>('button[data-index]'),
    )
    for (const button of buttons) {
      button.disabled = disabled
    }
  }

  private handleToggle = (event: Event) => {
    const target = event.currentTarget as HTMLButtonElement | null
    if (!target || this.hasAttribute('disabled')) return
    const index = Number(target.dataset.index)
    if (!Number.isFinite(index) || index < 0 || index >= this._svgs.length)
      return

    if (this._selectedIndices.has(index)) {
      this._selectedIndices.delete(index)
    } else {
      this._selectedIndices.add(index)
    }
    this.syncValueAttribute()
    this.updateSelectionState()
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
      }),
    )
  }

  render() {
    if (!this.shadowRoot) return
    this.shadowRoot.innerHTML = ''

    const style = document.createElement('style')
    style.textContent = `
:host {
  display: inline-block;
}
.svg-selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.svg-selection__item {
  background: transparent;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 4px;
  cursor: pointer;
  line-height: 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.svg-selection__item.is-selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}
.svg-selection__item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
.svg-selection__item:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.svg-selection__item svg {
  pointer-events: none;
}
`
    this.shadowRoot.appendChild(style)

    const container = document.createElement('div')
    container.className = 'svg-selection'

    this._svgs.forEach((svg, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'svg-selection__item'
      button.dataset.index = String(index)
      button.setAttribute('aria-pressed', 'false')
      button.innerHTML = svg
      button.addEventListener('click', this.handleToggle)
      container.appendChild(button)
    })

    this.shadowRoot.appendChild(container)
    this.updateSelectionState()
    this.updateDisabledState()
  }
}

if (customElements.get('svg-selection') === undefined) {
  customElements.define('svg-selection', SvgSelectionElement)
}

export default SvgSelectionElement
