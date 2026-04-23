// MathInput.ts
// Custom element <math-input> qui gère soit un MathfieldElement soit un input texte selon l'attribut data-type

import katex from 'katex'
import katexCss from 'katex/dist/katex.min.css?inline'
import { MathfieldElement } from 'mathlive'
import { buildDataKeyboardFromStyle } from './interactif/claviers/keyboard'
import type { IExercice } from './types'

type OptionsChamp = {
  texteApres?: string
  texteAvant?: string
  blocCenter?: boolean
  espace?: boolean
  placeholder?: string
}

type ParamsChamp = {
  type: 'texte' | 'mathlive'
  exercice: IExercice
  i: number
  style?: string
}

export function buildDataKeyboardString(style = ''): string {
  const blocks = buildDataKeyboardFromStyle(style)
  return blocks.join(' ')
}

function appendTexteApresWithKatex(container: Element, texteApres: string) {
  const parts = texteApres.split(/(\$[^$]+\$)/g).filter((part) => part !== '')

  if (parts.length === 0) return

  const host = document.createElement('span')
  host.style.marginLeft = '0px !important'
  host.style.paddingLeft = '0px !important'
  host.style.whiteSpace = 'nowrap'
  host.style.fontSize = '1em'
  host.className = 'texte-apres'
  host.style.display = 'inline-block'
  host.append(document.createTextNode('\u00a0'))

  parts.forEach((part) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1)
      const latexWithoutSpaceAtStart = latex.startsWith('~')
        ? latex.slice(1)
        : latex.startsWith('\\,')
          ? latex.slice(2)
          : latex
      const span = document.createElement('span')
      span.style.marginLeft = '0px !important'
      span.style.paddingLeft = '0px !important'
      span.style.whiteSpace = 'nowrap'
      span.style.fontSize = '1em !important'
      span.innerHTML = katex.renderToString(latexWithoutSpaceAtStart, {
        throwOnError: false,
      })
      host.appendChild(span)
    } else {
      host.append(document.createTextNode(part))
    }
  })

  container.appendChild(host)
}

export class MathInput extends HTMLElement {
  private inputEl: MathfieldElement | HTMLInputElement | null = null

  static get observedAttributes() {
    return [
      'data-type',
      'data-keyboard',
      'data-space',
      'placeholder',
      'value',
      'data-texte-avant',
      'data-texte-apres',
      'data-id',
      'data-min-width',
      'data-max-width',
    ]
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.render()
    }
  }

  get value() {
    return this.inputEl instanceof MathfieldElement
      ? this.inputEl.value
      : this.inputEl?.value || ''
  }

  set value(val: string) {
    if (this.inputEl instanceof MathfieldElement) {
      this.inputEl.value = val
    } else if (this.inputEl) {
      this.inputEl.value = val
    }
  }

  private render() {
    this.innerHTML = ''
    const type = this.getAttribute('data-type') || 'texte'
    const texteAvant = this.getAttribute('data-texte-avant') || ''
    const texteApres = this.getAttribute('data-texte-apres') || ''
    const id = this.getAttribute('data-id') || ''

    if (texteAvant) {
      const label = document.createElement('label')
      label.textContent = texteAvant
      this.appendChild(label)
    }

    if (type === 'mathlive') {
      const mf = document.createElement('math-field') as MathfieldElement
      mf.classList.add('ml-1')
      mf.id = id
      if (this.hasAttribute('placeholder'))
        mf.setAttribute('placeholder', this.getAttribute('placeholder')!)
      if (this.hasAttribute('data-keyboard'))
        mf.setAttribute(
          'virtual-keyboard-mode',
          this.getAttribute('data-keyboard')!,
        )
      if (this.hasAttribute('data-space'))
        mf.setAttribute('data-space', this.getAttribute('data-space')!)
      if (this.hasAttribute('data-min-width'))
        mf.style.minWidth = `${this.getAttribute('data-min-width')}px`
      if (this.hasAttribute('data-max-width'))
        mf.style.maxWidth = `${this.getAttribute('data-max-width')}px`
      if (this.hasAttribute('value')) mf.value = this.getAttribute('value')!
      this.inputEl = mf
      this.appendChild(mf)
      // Injection dans le shadowRoot du math-field une fois qu'il est connecté au DOM
      mf.addEventListener(
        'mount',
        () => {
          requestAnimationFrame(() => {
            if (!mf.shadowRoot?.querySelector('style[data-katex-style]')) {
              const style = document.createElement('style')
              style.setAttribute('data-katex-style', 'true')
              style.textContent = `${katexCss}
.texte-apres-host { 
  display: inline-block !important;
  vertical-align: middle;
}
.texte-apres-host .katex {
  font-size: 1em !important;
  font-weight: normal !important;
}
span.ML__container {
  padding: 0 !important;
}
span.ML__container::after {
  content: '';
}
/* Force le parent pour alignement horizontal */
.math-input-parent {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}`
              mf.shadowRoot?.appendChild(style)
            }

            const mlContainer = mf.shadowRoot?.querySelector(
              'span.ML__container',
            ) as HTMLElement
            const mlContainerParent = mlContainer?.parentElement
            if (mlContainerParent && mlContainer) {
              // Toujours forcer l'alignement horizontal pour éviter les décalages verticaux.
              mlContainerParent.classList.add('math-input-parent')
            }

            if (texteApres) {
              const existing = mf.shadowRoot?.querySelector('.texte-apres-host')
              existing?.remove()

              const texteApresHost = document.createElement('span')
              texteApresHost.className = 'texte-apres-host'
              appendTexteApresWithKatex(texteApresHost, texteApres)

              if (mlContainerParent && mlContainer) {
                mlContainerParent.insertBefore(
                  texteApresHost,
                  mlContainer.nextSibling,
                )
              } else {
                mf.shadowRoot?.appendChild(texteApresHost)
              }
            }
          })
        },
        { once: true },
      )
    } else {
      const input = document.createElement('input')
      input.id = id
      input.type = 'text'
      if (this.hasAttribute('placeholder'))
        input.placeholder = this.getAttribute('placeholder')!
      if (this.hasAttribute('value')) input.value = this.getAttribute('value')!
      this.inputEl = input
      this.appendChild(input)
      if (texteApres) {
        const span = document.createElement('span')
        span.textContent = '\u00a0' + texteApres
        this.appendChild(span)
      }
    }
  }
}
if (!customElements.get('math-input'))
  customElements.define('math-input', MathInput)

/**
 * Crée un élément <math-input> à partir des paramètres et options de ajouteChamp
 * @param params Paramètres du champ (type, exercice, i, style)
 * @param options Options du champ (texteAvant, texteApres, blocCenter, espace, placeholder)
 * @returns HTML du <math-input>
 */
export function addMathInput(
  params: ParamsChamp,
  options: OptionsChamp = {},
): string {
  const { type, exercice, i, style = '' } = params
  const {
    texteAvant = '',
    texteApres = '',
    espace = false,
    placeholder = '',
  } = options

  const dataKeyboard = buildDataKeyboardString(
    typeof style === 'string' ? style : '',
  )

  let html = `<math-input 
    data-type="${type}" 
    ${dataKeyboard ? `data-keyboard="${dataKeyboard}"` : ''} 
    ${espace ? 'data-space="true"' : ''} 
    ${placeholder ? `placeholder="${placeholder}"` : ''} 
    ${texteAvant ? `data-texte-avant="${texteAvant}"` : ''} 
    ${texteApres ? `data-texte-apres="${texteApres}"` : ''} 
    class="${style}" 
    data-id="champTexteEx${exercice.numeroExercice}Q${i}">
  </math-input>`

  html += ` <span id="resultatCheckEx${exercice.numeroExercice}Q${i}"></span>`

  return html
}
