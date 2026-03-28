import { MathfieldElement } from 'mathlive'
import type { IExercice, ValeurNames } from '../../types'
import { buildDataKeyboardFromStyle, KeyboardType } from '../claviers/keyboard'
import { setMathfield, setMathfieldListener } from './setMathfield'

export type DataOptionsMultiMathfield = Partial<
  Record<
    ValeurNames,
    {
      keyboard?: string
      placeholder?: string
      maxWidth?: number
      minWidth?: number
    }
  >
>

const buildDataKeyboardString = (style = '') => {
  const blocks = buildDataKeyboardFromStyle(style)
  return blocks.join(' ')
}

export class MultiMathfieldElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.render()
  }

  render() {
    const template = this.getAttribute('data-template') || ''
    const options = JSON.parse(this.getAttribute('data-options') || '{}')
    // Regex qui détecte $...$ ou %{champ} ou texte
    const regex = /(\$[^$]+\$|%\{[^}]+\})/g
    let lastIndex = 0
    let match
    const container = document.createElement('span')
    container.style.display = 'inline-block'

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        container.appendChild(
          document.createTextNode(template.slice(lastIndex, match.index)),
        )
      }
      const token = match[0]
      if (token.startsWith('%{')) {
        // Champ éditable
        const name = token.slice(2, -1)
        const div = document.createElement('DIV')
        div.style.display = 'inline-block'
        const mathfield = new MathfieldElement()
        mathfield.classList.add('ml-1')
        if (options[name]) {
          const style = options[name].keyboard ? options[name].keyboard : ''
          const placeHolder = options[name].placeholder
            ? options[name].placeholder
            : ''
          const maxWidth = options[name].maxWidth ? options[name].maxWidth : 100
          mathfield.style.maxWidth = `${maxWidth}px`
          const minWidth = options[name].minWidth ? options[name].minWidth : 30
          mathfield.style.minWidth = `${minWidth}px`
          const dataKeyboard = buildDataKeyboardString(
            typeof style === 'string' ? style : '',
          )
          mathfield.setAttribute('data-keyboard', dataKeyboard)
          if (placeHolder !== '') {
            mathfield.setAttribute('placeholder', placeHolder)
          }
        }
        // On donne comme id la concaténation de l'id du MultiMathfield (this.id) et du name du champ pour être sûr d'avoir un id unique
        mathfield.id = (this.id ? this.id : 'multi-mathfield') + '-' + name
        mathfield.style.verticalAlign = 'middle'
        mathfield.style.borderRadius = '8px'
        mathfield.style.boxShadow =
          'inset 2px 2px 6px #ccc, inset -2px -2px 6px #fff'
        mathfield.style.marginRight = '4px'

        div.appendChild(mathfield)
        // Ajoute un span de vérification après chaque Mathfield
        const checkSpan = document.createElement('span')
        checkSpan.id = 'check-' + mathfield.id
        div.appendChild(checkSpan)
        container.appendChild(div)

        if (mathfield.isConnected) {
          setMathfield(mathfield)
        } else {
          mathfield.addEventListener('mount', setMathfieldListener, {
            once: true,
          })
        }
      } else if (token.startsWith('$')) {
        // Bloc latex readonly
        const latex = token.slice(1, -1)
        const mf = new MathfieldElement()
        mf.value = latex
        mf.readOnly = true
        mf.style.pointerEvents = 'none'
        mf.style.verticalAlign = 'middle'
        mf.style.border = 'none'
        mf.style.margin = '0'
        mf.style.padding = '0'
        container.appendChild(mf)
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < template.length) {
      container.appendChild(document.createTextNode(template.slice(lastIndex)))
    }

    // Nettoie et insère dans le shadow DOM
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = ''
      // Ajoute le style pour masquer les toggles
      const style = document.createElement('style')
      style.textContent = `
        math-field::part(menu-toggle) {
          display: none;
        }
        math-field::part(virtual-keyboard-toggle) {
          display: none;
        }
      `
      this.shadowRoot.appendChild(style)
      this.shadowRoot.appendChild(container)
    }
  }

  getValue() {
    const result: Record<string, any> = {}
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll('math-field').forEach((el) => {
        const mf = el as MathfieldElement
        const name = mf.getAttribute('data-name')
        if (name) {
          result[name] = mf.value
        }
      })
    }
    return result
  }

  setAnswers(answers: Record<string, any>) {
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll('math-field').forEach((el) => {
        const mf = el as MathfieldElement
        const name = mf.getAttribute('data-name')
        if (name && answers[name] !== undefined) {
          mf.value = answers[name]
        }
      })
    }
  }
}

export function addMultiMathfield(
  exercice: IExercice,
  questionIndex: number,
  {
    dataTemplate,
    dataOptions,
  }: { dataTemplate: string; dataOptions: DataOptionsMultiMathfield },
) {
  if (!customElements.get('multi-mathfield')) {
    customElements.define('multi-mathfield', MultiMathfieldElement)
  }
  // Extraction des noms de champs %{name}
  const regex = /%\{([^}]+)\}/g
  let match
  const enrichedOptions: Record<string, any> = { ...dataOptions }
  while ((match = regex.exec(dataTemplate)) !== null) {
    const name = match[1]
    if (!(name in enrichedOptions)) {
      enrichedOptions[name] = {
        placeholder: '',
        minWidth: 30,
        maxWidth: 100,
        keyboard: KeyboardType.clavierNumbers,
      }
    } else {
      // Ajoute les valeurs par défaut manquantes
      if (enrichedOptions[name].placeholder === undefined)
        enrichedOptions[name].placeholder = ''
      if (enrichedOptions[name].minWidth === undefined)
        enrichedOptions[name].minWidth = 30
      if (enrichedOptions[name].maxWidth === undefined)
        enrichedOptions[name].maxWidth = 100
      if (enrichedOptions[name].keyboard === undefined)
        enrichedOptions[name].keyboard = KeyboardType.clavierNumbers
    }
  }
  return `<multi-mathfield id="multiMathfieldEx${exercice.numeroExercice}Q${questionIndex}" data-template="${dataTemplate}" data-options='${JSON.stringify(enrichedOptions)}'></multi-mathfield>`
}
if (!customElements.get('multi-mathfield')) {
  customElements.define('multi-mathfield', MultiMathfieldElement)
}
