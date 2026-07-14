import ListeDeroulante, {
  type AllChoicesType,
} from '../interactif/listeDeroulante/ListeDeroulante'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'
export type ListeDeroulanteDataOptions = {
  choix0?: boolean
  className?: string
  choices?: AllChoicesType
}

class ListeDeroulanteElement extends MathaleaCustomElement {
  static readonly elementTag = 'liste-deroulante'

  private _listeDeroulante?: ListeDeroulante
  private _lastValue = ''

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static create({
    exercice,
    questionIndex,
    dataOptions,
  }: {
    exercice: IExercice
    questionIndex: number
    dataOptions: ListeDeroulanteDataOptions
  }): string {
    const attrs: string[] = []
    attrs.push(
      `id="liste-deroulanteEx${exercice.numeroExercice}Q${questionIndex}"`,
    )
    if (dataOptions.className) attrs.push(`class="${dataOptions.className}"`)
    if (dataOptions.choices) {
      attrs.push(
        `choices="${encodeURIComponent(JSON.stringify(dataOptions.choices))}"`,
      )
    }
    if (dataOptions.choix0 !== undefined) {
      attrs.push(`choix0="${dataOptions.choix0 ? 'true' : 'false'}"`)
    }
    return `<liste-deroulante ${attrs.join(' ')}></liste-deroulante>`
  }

  static get observedAttributes() {
    return ['choices']
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'choices' && oldValue !== newValue) {
      this.render()
    }
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    this.render()
  }

  set choices(val: AllChoicesType) {
    this._choices = val
    this.render()
  }

  get choices(): AllChoicesType {
    return this._choices
  }

  private _choices: AllChoicesType = []

  private emitValueChangedIfNeeded() {
    const currentValue = this.value
    if (currentValue === this._lastValue) return
    this._lastValue = currentValue
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: currentValue },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    if (this.shadowRoot) this.shadowRoot.innerHTML = ''

    // Ajoute le CSS compilé directement ici (copie-colle le contenu du .css généré)
    const style = document.createElement('style')
    style.textContent = `
span.listeDeroulante {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: #fff;
  color: #333;
  border: 1px solid #d1d5db; /* gris clair moderne */
  border-radius: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 2px 6px;
}

span.listeDeroulante:hover {
  border-color: #3b82f6; /* bleu Tailwind */
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

span.listeDeroulante span.currentChoice {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  outline: none;
}

span.listeDeroulante .trigger {
  margin-left: auto;
  padding: 6px 8px;
  font-weight: bold;
  font-size: 0.9em;
  color: #6b7280; /* gris neutre */
  border-left: 1px solid #e5e7eb;
  transition: color 0.2s ease;
}

span.listeDeroulante .trigger:hover {
  color: #111827; /* noir doux */
}

span.listeDeroulante .ok {
  color: #10b981; /* vert moderne */
}

span.listeDeroulante .ko {
  color: #ef4444; /* rouge moderne */
}

/* Liste déroulante */
span.listeDeroulante ul {
  position: fixed;
  width: max-content;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin: 4px 0 0 0;
  padding: 4px 0;
  display: none;
  z-index: 100;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  animation: fadeIn 0.15s ease-out;
  max-height: 60vh;
  overflow-y: auto;
}

span.listeDeroulante ul.visible {
  display: block;
}

span.listeDeroulante ul li {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #111827;
  background: #fff;
  transition: background 0.2s ease, color 0.2s ease;
  border: none;
}

span.listeDeroulante ul li:hover {
  background: #f3f4f6;
  color: #1d4ed8; /* bleu accent */
}

span.listeDeroulante ul li.selected {
  background: #e0f2fe;
  color: #0284c7;
  font-weight: 500;
}

span.listeDeroulante.disabled {
  cursor: not-allowed;
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #9ca3af;
}

span.listeDeroulante.disabled .trigger {
  color: #d1d5db;
}

span.listeDeroulante.disabled span.currentChoice {
  pointer-events: none;
}

span.listeDeroulante math-field {
  pointer-events: none;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 0 !important;
}

span.listeDeroulante ul li svg.svgChoice {
  width: 1.2em;
  height: 1.2em;
  margin-right: 6px;
  flex-shrink: 0;
  fill: currentColor;
}

/* Animation d'apparition */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`
    this.shadowRoot!.appendChild(style)

    // Création du conteneur
    const container = document.createElement('span')
    this.shadowRoot!.appendChild(container)

    // Récupère les choix depuis l'attribut ou la propriété
    let choices: AllChoicesType = this.choices
    if (!choices.length && this.hasAttribute('choices')) {
      try {
        const attr = decodeURIComponent(this.getAttribute('choices')!)
        choices = JSON.parse(attr)
      } catch {
        choices = []
      }
    }
    const choix0 = this.hasAttribute('choix0')
      ? this.getAttribute('choix0') !== 'false'
      : false

    // Création de la liste déroulante
    this._listeDeroulante = new ListeDeroulante(choices, { choix0 })
    this._listeDeroulante._init({ conteneur: container })
    if (!this.interactivityOn) {
      this._listeDeroulante.disabled = true
      container.classList.add('disabled')
      container.setAttribute('aria-disabled', 'true')
    }
    const originalSelect = this._listeDeroulante.select.bind(
      this._listeDeroulante,
    )
    this._listeDeroulante.select = (
      index: number,
      options?: { withoutOffset?: boolean },
    ) => {
      const result = originalSelect(index, options)
      this.emitValueChangedIfNeeded()
      return result
    }
    this._lastValue = this.value
  }

  // API JS pour récupérer la valeur sélectionnée
  get value() {
    return this._listeDeroulante?.reponse ?? ''
  }

  set value(val) {
    if (this._listeDeroulante) {
      this._listeDeroulante.select(
        this._listeDeroulante.choices.findIndex((el) => el.value === val) +
          this._listeDeroulante._offset,
      )
      this.emitValueChangedIfNeeded()
    }
  }
}

// La réponse stockée est déjà lisible et l'élément peut rester affiché dans
// les corrections : les hooks par défaut de MathaleaCustomElement suffisent.
registerMathaleaCustomElement(ListeDeroulanteElement)
export default ListeDeroulanteElement
