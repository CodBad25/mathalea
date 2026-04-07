import { MathfieldElement } from 'mathlive'
import { context } from '../../../modules/context'
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

  /**
   * Extrait les réponses des champs depuis un filledTemplate de la forme
   * $2\times($%{champ1:"7"}$+$%{champ2:"10"}$)=%{champ3:"34"}
   * et retourne un objet { champ1: "7", champ2: "10", champ3: "34" }
   */
  static answersFromFilledTemplate(
    filledTemplate: string,
  ): Record<string, string> {
    const result: Record<string, string> = {}
    if (typeof filledTemplate !== 'string') return result
    // Regex pour trouver %{champ:"valeur"}
    const regex = /%\{([a-zA-Z0-9_]+):"([^"]*)"\}/g
    let match
    while ((match = regex.exec(filledTemplate)) !== null) {
      const champ = match[1]
      const valeur = match[2]
      result[champ] = valeur
    }
    return result
  }

  connectedCallback() {
    this.render()
  }

  render() {
    const template = this.getAttribute('data-template') || ''
    const options = JSON.parse(this.getAttribute('data-options') || '{}')
    const champNames: string[] = []
    // On extrait les noms de champs pour gérer la navigation au clavier
    const champRegex = /%\{([^}:]+)(:[^}]*)?\}/g
    let matchChamp
    while ((matchChamp = champRegex.exec(template)) !== null) {
      const name = matchChamp[1]
      if (!champNames.includes(name)) {
        champNames.push(name)
      }
    }
    let champIndex = 0
    // Regex qui détecte $...$, %{champ}, \n ou texte
    const regex = /(\$[^$]+\$|%\{[^}]+\}|\n)/g
    let lastIndex = 0
    let match
    // On commence avec un span courant
    let currentSpan = document.createElement('span')
    currentSpan.style.display = 'inline-block'
    const container = document.createElement('span')
    container.style.display = 'inline-block'
    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        // 2. On parcourt le template comme avant
        currentSpan.appendChild(
          document.createTextNode(template.slice(lastIndex, match.index)),
        )
      }
      const token = match[0]
      if (token === '\n') {
        // On ferme le span courant, ajoute <br>, puis nouveau span
        if (currentSpan.childNodes.length > 0) {
          container.appendChild(currentSpan)
        }
        container.appendChild(document.createElement('br'))
        currentSpan = document.createElement('span')
        currentSpan.style.display = 'inline-block'
      } else if (token.startsWith('%{')) {
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
        mathfield.setAttribute('data-name', name)
        mathfield.style.verticalAlign = 'middle'
        mathfield.style.borderRadius = '4px'
        mathfield.style.boxShadow =
          'inset 2px 2px 6px #ccc, inset -2px -2px 6px #fff'
        mathfield.style.marginRight = '4px'
        mathfield.style.marginLeft = '4px'
        // Centre la saisie dans le champ
        mathfield.style.alignContent = 'center'

        // Ajout gestionnaire TAB pour navigation fiable (uniquement sur les champs éditables)
        const myIndex = champIndex
        mathfield.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const total = champNames.length
            let nextIndex
            if (!e.shiftKey) {
              nextIndex = (myIndex + 1) % total
            } else {
              nextIndex = (myIndex - 1 + total) % total
            }
            const nextName = champNames[nextIndex]
            const nextId =
              (this.id ? this.id : 'multi-mathfield') + '-' + nextName
            if (this.shadowRoot) {
              const next = this.shadowRoot.getElementById(nextId)
              // On ne focus que si c'est bien un MathfieldElement éditable
              if (next && next instanceof MathfieldElement && !next.readOnly) {
                ;(next as HTMLElement).focus()
              }
            }
          }
        })
        champIndex++
        div.appendChild(mathfield)
        // Ajoute un span de vérification après chaque Mathfield
        const checkSpan = document.createElement('span')
        checkSpan.id = 'check-' + mathfield.id
        div.appendChild(checkSpan)
        currentSpan.appendChild(div)

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
        currentSpan.appendChild(mf)
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < template.length) {
      currentSpan.appendChild(
        document.createTextNode(template.slice(lastIndex)),
      )
    }
    // Ajoute le dernier span s'il n'est pas vide
    if (currentSpan.childNodes.length > 0) {
      container.appendChild(currentSpan)
    }

    // Nettoie et insère dans le shadow DOM
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = ''
      // Ajoute le style pour masquer les toggles et centrer la saisie
      const style = document.createElement('style')
      style.textContent = `
        math-field::part(menu-toggle) {
          display: none;
        }
        math-field::part(virtual-keyboard-toggle) {
          display: none;
        }
        math-field {
          text-align: center;
        }
        math-field::part(content) {
          justify-content: center;
        }`
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
  if (context.isHtml && exercice.interactif) {
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
    return `<multi-mathfield id="multiMathfieldEx${exercice.numeroExercice}Q${questionIndex}" data-template="${dataTemplate}" data-options='${JSON.stringify(enrichedOptions)}'></multi-mathfield>
    <div  class ="ml-2 py-2 italic text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest" id="feedbackEx${exercice.numeroExercice}Q${questionIndex}" style="display: none;"></div>`
  } else {
    // On veut aussi gérer les retours à la ligne (\n) en <br>
    const regex = /(%\{[^}]+\}|\n)/g
    let lastIndex = 0
    let match
    let result = ''
    while ((match = regex.exec(dataTemplate)) !== null) {
      if (match.index > lastIndex) {
        result += dataTemplate.slice(lastIndex, match.index)
      }
      const token = match[0]
      if (token === '\n') {
        result += '<br>'
      } else {
        // Remplace les champs par des underscores
        result += '$\\ldots\\ldots$'
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < dataTemplate.length) {
      result += dataTemplate.slice(lastIndex)
    }
    return result
  }
}

if (!customElements.get('multi-mathfield')) {
  customElements.define('multi-mathfield', MultiMathfieldElement)
}
