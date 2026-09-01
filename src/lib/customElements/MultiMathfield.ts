// Utilitaire pour styliser les items a), b), ... dans un texte brut
import renderMathInElement from 'katex/contrib/auto-render'
import katexCss from 'katex/dist/katex.min.css?inline'
import { MathfieldElement } from 'mathlive'
import { context } from '../../modules/context'
import { bleuMathalea } from '../colors'
import { setStyles } from '../html/dom'
import {
  compteChampsDeReponse,
  pointsMaxDuBareme,
} from '../interactif/baremeExercice'
import {
  buildDataKeyboardFromStyle,
  KeyboardType,
} from '../interactif/claviers/keyboard'
import { fonctionComparaison } from '../interactif/comparisonFunctions'
import { toutAUnPoint } from '../interactif/fonctionsBaremes'
import { setMathfield, setMathfieldListener } from '../interactif/setMathfield'
import { optionsKatex } from '../latex/Katex'
import type { IExercice, ValeurNames } from '../types'
import './ListeDeroulanteElement'
import type ListeDeroulanteElement from './ListeDeroulanteElement'
import type { AllChoicesType, AllChoiceType } from './ListeDeroulanteElement'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'

function stylizeItems(text: string, output: 'html' | 'latex' = 'html'): string {
  const itemRegex = /(^|\s+)([a-z]\))/g
  return text.replace(itemRegex, (_match, prefix, item, offset) => {
    const isAtLineStart = text.slice(0, offset).trim() === ''

    if (output === 'latex') {
      return (prefix || '') + `$\\textbf{${item}}$`
    }

    const styles = [`color:${bleuMathalea}`, 'font-weight:bold']
    if (isAtLineStart) {
      styles.push('display:inline-block', 'margin-left:0.75em')
    }

    return (
      (prefix || '') + `<span style="${styles.join('; ')}">` + item + '</span>'
    )
  })
}

function buildLatexEnumitemBlock(lines: string[]): string | null {
  const itemLineRegex = /^\s*([a-z])\)\s*(.*)$/
  const nonEmptyLines = lines.filter((line) => line.trim() !== '')

  if (
    nonEmptyLines.length === 0 ||
    !nonEmptyLines.every((line) => itemLineRegex.test(line))
  ) {
    return null
  }

  const items = nonEmptyLines.map((line) => {
    const match = line.match(itemLineRegex)
    return `\\item ${match?.[2] ?? ''}`
  })

  return [
    '\\begin{enumerate}[label=\\alph*)]',
    ...items,
    '\\end{enumerate}',
  ].join('\n')
}

export type DataOptionsMultiMathfield = Partial<
  Record<
    ValeurNames,
    {
      keyboard?: string
      placeholder?: string
      minWidth?: number
      texteApres?: string
      ldots?: boolean
      /**
       * Si ce tableau est fourni, le champ n'est pas un MathLive mais une liste
       * déroulante proposant ces choix.
       */
      choices?: AllChoicesType
      /**
       * Si ce tableau est fourni, le champ n'est pas un MathLive mais un QCM
       * radio proposant ces choix.
       */
      qcm?: AllChoicesType
      /** Le premier choix de la liste est-il sélectionnable ? */
      choix0?: boolean
      vertical?: boolean
    }
  >
>

export type MultiMathfieldOptions = {
  dataTemplate: string
  dataOptions: DataOptionsMultiMathfield
  id?: string
}

export type MultiMathfieldCreateOptions = MultiMathfieldOptions & {
  numeroExercice?: number
  questionIndex?: number
  interactivityOn?: boolean
}

type MultiMathfieldAnswers = Record<string, string>
type MultiMathfieldOption = {
  keyboard?: string
  placeholder?: string
  minWidth?: number
  texteApres?: string
  ldots?: boolean
  choices?: AllChoicesType
  qcm?: AllChoicesType
  choix0?: boolean
  vertical?: boolean
}

function choiceValue(choice: AllChoiceType): string {
  return typeof choice === 'string' ? choice : choice.value
}

function choiceHtml(choice: AllChoiceType): string {
  if (typeof choice === 'string') return choice
  if (choice.label != null) return String(choice.label)
  if (choice.latex != null) return `$${choice.latex}$`
  if (choice.svg != null) return choice.svg
  if (choice.image != null) {
    return `<img src="${choice.image}" alt="${choice.value}" style="width:30px;height:30px;display:inline-block;vertical-align:middle;">`
  }
  return choice.value
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

const buildDataKeyboardString = (style = '') => {
  const blocks = buildDataKeyboardFromStyle(style)
  return blocks.join(' ')
}

function renderKatexInElement(element: HTMLElement): void {
  Object.assign(optionsKatex, {
    preProcess: (chaine: string) =>
      '{' + chaine.replaceAll(String.fromCharCode(160), '\\,') + '}',
  })
  renderMathInElement(element, optionsKatex as any)
}
/**
 * @author Jean-Claude Lhote + Rémi Angot
 */
export class MultiMathfieldElement extends MathaleaCustomElement {
  private static scoreFromResult(result: { isOk: boolean }): number {
    const score = (result as { score?: unknown }).score
    return typeof score === 'number' ? score : result.isOk ? 1 : 0
  }

  /**
   * La valeur stockée est de la forme `%{champ:"valeur"} %{champ2:"valeur2"}` :
   * on remplace chaque champ par sa valeur entourée de dollars.
   */
  static formatStudentAnswer(rawAnswer: string): string {
    if (typeof rawAnswer !== 'string') return ''
    const fromJson = (() => {
      try {
        const parsed = JSON.parse(rawAnswer) as unknown
        if (
          parsed == null ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed)
        ) {
          return null
        }
        const values = Object.values(parsed as Record<string, unknown>)
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0)
        return values.length === 0
          ? ''
          : values
              .map((value) => {
                let v = value
                if (!v.startsWith('$')) v = '$' + v
                if (!v.endsWith('$')) v += '$'
                return v
              })
              .join(' ; ')
      } catch {
        return null
      }
    })()
    if (fromJson != null) return fromJson

    const cleaned = rawAnswer.replace(
      /%\{([a-zA-Z0-9_]+):"([^"]*)"\}/g,
      (_match, _champ, valeur: string) => {
        // Ajoute des dollars autour de la valeur, en évitant les doubles dollars
        let v = valeur.trim()
        if (!v.startsWith('$')) v = '$' + v
        if (!v.endsWith('$')) v += '$'
        return v
      },
    )
    // Nettoie les doubles dollars successifs
    return cleaned.replace(/\${2,}/g, '')
  }

  static readonly elementTag = 'multi-mathfield'

  private readonly contentHost: HTMLSpanElement

  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })

    // Les styles KaTeX doivent exister dans le shadowRoot pour un rendu complet.
    const style = document.createElement('style')
    style.textContent = `
      ${katexCss}
      /* Le shadowRoot ne reçoit pas la surcharge globale de app.css : sans elle,
         KaTeX rendrait ici en 1,21em et la police jurerait avec le reste de la question. */
      .katex {
        font-size: 1em;
      }
      math-field::part(menu-toggle) {
        display: none;
      }
      math-field::part(virtual-keyboard-toggle) {
        display: none;
      }
      math-field {
        color: var(--color-coopmaths-corpus, #1f2429);
        --caret-color: hsl(212, 40%, 49%);
        --selection-color: #000;
        --selection-background-color: hsl(212, 70%, 85%);
        --contains-highlight-color: hsl(212, 40%, 49%);
        --contains-highlight-background-color: hsl(212, 40%, 95%);
        --highlight-text: hsla(212, 40%, 50%, 0.1);
        line-height: 1;
        border-radius: 4px;
        border: none;
        background-color: transparent;
        font-size: 1em;
        margin-left: 5px;
        display: inline-block;
        vertical-align: middle;
        min-width: 50px;
      }
      :host-context(.dark) math-field {
        color: var(--color-coopmathsdark-corpus, #b0b0b0);
        --caret-color: hsl(212, 65%, 55%);
        --selection-color: #fff;
        --selection-background-color: hsl(212, 65%, 55%);
        --contains-highlight-color: hsl(212, 85%, 75%);
        --contains-highlight-background-color: hsl(212, 30%, 40%);
        --highlight-text: hsla(212, 40%, 50%, 0.6);
      }
      math-field::part(container) {
        border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        min-width: 50px;
        display: inline-block;
        justify-content: center;
      }
      :host-context(.dark) math-field::part(container) {
        border: 1px solid rgba(213, 206, 206, 0.917);
      }
      math-field::part(content) {
        padding: 0;
        justify-content: center;
      }
      math-field:focus-within {
        outline: solid;
        outline-width: 2px;
        outline-color: var(--color-coopmaths-struct, #216d9a);
        border: none;
      }
      math-field:focus-within::part(container) {
        outline: none;
        border: none;
      }
      /* QCU : le shadowRoot ne reçoit ni Tailwind ni la surcharge de app.css.
         On reproduit ici le style des autres QCM du site (ex. 1A-E01-1) :
         bouton radio « coopmaths-action », espacement et alignement. */
      [data-type='qcm'] {
        display: inline-flex;
        gap: 1.5rem;
        align-items: center;
        vertical-align: middle;
      }
      [data-type='qcm'][data-vertical='true'] {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
      [data-type='qcm'] > span {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
      }
      [data-type='qcm'] input[type='radio'] {
        appearance: none;
        -webkit-appearance: none;
        box-sizing: border-box;
        height: 1rem;
        width: 1rem;
        margin: 0;
        padding: 0;
        border: 1px solid var(--color-coopmaths-action, #f15929);
        border-radius: 50%;
        background-color: transparent;
        vertical-align: middle;
        cursor: pointer;
      }
      :host-context(.dark) [data-type='qcm'] input[type='radio'] {
        border-color: var(--color-coopmathsdark-action, #ffb86c);
      }
      [data-type='qcm'] input[type='radio']:checked {
        border-color: var(--color-coopmaths-action, #f15929);
        background-color: var(--color-coopmaths-action, #f15929);
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
      }
      [data-type='qcm'] input[type='radio']:disabled {
        opacity: 0.3;
        cursor: default;
      }
      [data-type='qcm'] label {
        vertical-align: middle;
        cursor: pointer;
      }
      [data-type='qcm'] input[type='radio']:disabled + label {
        cursor: default;
      }
    `
    shadowRoot.appendChild(style)

    this.contentHost = document.createElement('span')
    this.contentHost.style.display = 'inline-block'
    shadowRoot.appendChild(this.contentHost)
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
    // Parcourt le template rempli et récupère les valeurs injectées
    // Exemple: %{champ1:"7"} ou %{champ2}
    const regex = /%\{([a-zA-Z0-9_]+)(?::"([^"]*)")?\}/g
    let match
    while ((match = regex.exec(filledTemplate)) !== null) {
      const champ = match[1]
      const valeur = match[2] ?? ''
      result[champ] = valeur
    }
    return result
  }

  static create({
    id,
    numeroExercice,
    questionIndex,
    dataTemplate,
    dataOptions,
    interactivityOn = true,
  }: MultiMathfieldCreateOptions): string {
    if (!context.isHtml || context.isTypst || !interactivityOn) {
      const output = context.isHtml ? 'html' : 'latex'
      const rendered = this.renderStaticTemplate(
        dataTemplate,
        dataOptions,
        output,
        (fieldOptions) => {
          if (!fieldOptions.ldots) return ''
          return context.isHtml ? ' ... ' : '$\\ldots\\ldots$'
        },
        `labelEx${numeroExercice ?? 0}Q${questionIndex ?? 0}R`,
      )

      if (!context.isHtml && !rendered.includes('\\begin{qcmprop}')) {
        const enumitemBlock = buildLatexEnumitemBlock(rendered.split('\n'))
        if (enumitemBlock) {
          return enumitemBlock
        }
      }

      return rendered
    }

    const computedId =
      id ??
      `${MultiMathfieldElement.elementTag}Ex${numeroExercice ?? 0}Q${questionIndex ?? 0}`
    const dataOptionsStr = encodeURIComponent(JSON.stringify(dataOptions))
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    const html = `<multi-mathfield id="${computedId}" data-template="${dataTemplate.replace(/"/g, '&quot;')}" data-options="${dataOptionsStr}"></multi-mathfield>`
    return `${html}<div class="ml-2 py-2 italic text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest" id="feedbackEx${numeroExercice ?? 0}Q${questionIndex ?? 0}" style="display: none;"></div>`
  }

  private static staticQcm(
    choices: AllChoicesType,
    vertical = false,
    output: 'html' | 'latex' = 'html',
    labelPrefix = 'labelEx0Q0R',
    firstLabelIndex = 0,
  ): string {
    const filteredChoices = choices.filter(
      (choice) => choiceValue(choice) !== '',
    )
    if (output === 'latex') {
      const finalCols = vertical ? 1 : Math.max(filteredChoices.length, 1)
      const contenuTasks = filteredChoices
        .map((choice) => `  \\task ${choiceHtml(choice)}\n`)
        .join('')
      return `\\begin{qcmprop}[cols=${finalCols}, case]\n${contenuTasks}\\end{qcmprop}`
    }

    const items = filteredChoices.map(
      (choice, index) =>
        `<span class="ex0" style="display:inline-flex;align-items:center;gap:0.5rem"><input type="radio" disabled style="appearance:none;-webkit-appearance:none;box-sizing:border-box;opacity:1;height:1rem;width:1rem;margin:0;padding:0;border:1px solid var(--color-coopmaths-action, #f15929);border-radius:50%;background:transparent;vertical-align:middle" class="disabled:cursor-default"><label id="${labelPrefix}${firstLabelIndex + index}">${choiceHtml(choice)}</label></span>`,
    )
    return `<span class="mx-2" style="display:inline-flex;${vertical ? 'flex-direction:column;align-items:flex-start;gap:0.5rem' : 'align-items:center;gap:1.5rem'}">${items.join('')}</span>`
  }

  static renderStaticTemplate(
    dataTemplate: string,
    dataOptions: DataOptionsMultiMathfield,
    output: 'html' | 'latex' = 'html',
    freeFieldPlaceholder: (fieldOptions: MultiMathfieldOption) => string = () =>
      ' ... ',
    qcmLabelPrefix = 'labelEx0Q0R',
  ): string {
    const template = dataTemplate.replaceAll('<br>', '\n')
    const regex = /(\$[^$]+\$|%\{[^}]+\}|\n)/g
    let lastIndex = 0
    let result = ''
    let match
    let nextQcmLabelIndex = 0

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        result += stylizeItems(template.slice(lastIndex, match.index), output)
      }
      const token = match[0]
      if (token === '\n') {
        result += output === 'html' ? '<br>' : '\n'
      } else if (token.startsWith('%{')) {
        const name = token.slice(2, -1) as ValeurNames
        const fieldOptions = dataOptions[name] ?? {}
        let hasVisibleField = true
        if (
          Array.isArray(fieldOptions.choices) &&
          fieldOptions.choices.length > 0
        ) {
          result += this.staticQcm(
            fieldOptions.choices,
            fieldOptions.vertical ?? true,
            output,
            qcmLabelPrefix,
            nextQcmLabelIndex,
          )
          nextQcmLabelIndex += fieldOptions.choices.filter(
            (choice) => choiceValue(choice) !== '',
          ).length
        } else if (
          Array.isArray(fieldOptions.qcm) &&
          fieldOptions.qcm.length > 0
        ) {
          result += this.staticQcm(
            fieldOptions.qcm,
            fieldOptions.vertical ?? false,
            output,
            qcmLabelPrefix,
            nextQcmLabelIndex,
          )
          nextQcmLabelIndex += fieldOptions.qcm.filter(
            (choice) => choiceValue(choice) !== '',
          ).length
        } else {
          const placeholder = freeFieldPlaceholder(fieldOptions)
          result += placeholder
          hasVisibleField = placeholder !== ''
        }
        // Sans champ visible (ni choix, ni QCM, ni pointillés), on n'ajoute pas
        // le texte d'unité : sinon il « pendouille » après la question en mode
        // non interactif (ex. « Quel sera le capital au bout de 3 ans ? euros »).
        if (hasVisibleField && fieldOptions.texteApres) {
          result += fieldOptions.texteApres
        }
      } else {
        result += token
      }
      lastIndex = regex.lastIndex
    }

    if (lastIndex < template.length) {
      result += stylizeItems(template.slice(lastIndex), output)
    }
    return result
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return questionHtml.replace(
      /<multi-mathfield\b([^>]*)>(?:<\/multi-mathfield>)?/g,
      (_match, rawAttributes: string) => {
        const attributes = String(rawAttributes)
        const templateMatch = attributes.match(/\bdata-template="([^"]*)"/)
        const optionsMatch = attributes.match(/\bdata-options="([^"]*)"/)
        const dataTemplate = decodeHtmlAttribute(templateMatch?.[1] ?? '')
        let dataOptions: DataOptionsMultiMathfield = {}
        if (optionsMatch?.[1] != null) {
          try {
            dataOptions = JSON.parse(
              decodeURIComponent(decodeHtmlAttribute(optionsMatch[1])),
            )
          } catch (error) {
            window.notify('Erreur lors du rendu statique du multi-mathfield.', {
              error,
            })
          }
        }
        return this.renderStaticTemplate(dataTemplate, dataOptions)
      },
    )
  }

  connectedCallback() {
    this.hydrateCommonAttributes()
    this.render()
  }

  protected onInteractivityChanged(_isOn: boolean): void {
    if (this.isConnected) this.render()
  }

  /**
   * Construit une liste déroulante imbriquée pour un champ défini avec `choices`.
   * L'id est préfixé par le tag pour que le span de résultat créé par
   * `ListeDeroulanteElement` ne rentre pas en collision avec l'élément lui-même.
   */
  private createListeDeroulante(
    name: string,
    fieldOptions: MultiMathfieldOption,
  ): ListeDeroulanteElement {
    const liste = document.createElement(
      'liste-deroulante',
    ) as ListeDeroulanteElement
    liste.id = `liste-deroulante-${this.id || 'multi-mathfield'}-${name}`
    liste.setAttribute('data-name', name)
    liste.setAttribute('class', 'mx-2 listeDeroulante')
    liste.setAttribute(
      'choices',
      encodeURIComponent(JSON.stringify(fieldOptions.choices ?? [])),
    )
    liste.setAttribute('choix0', fieldOptions.choix0 ? 'true' : 'false')
    liste.setAttribute(
      'interactivity-on',
      this.interactivityOn ? 'true' : 'false',
    )
    return liste
  }

  private createQcm(
    name: string,
    fieldOptions: MultiMathfieldOption,
  ): HTMLSpanElement {
    const qcm = document.createElement('span')
    qcm.setAttribute('data-name', name)
    qcm.setAttribute('data-type', 'qcm')
    qcm.className = 'mx-2 inline-block'
    const choices = fieldOptions.qcm ?? []
    const inputName = `qcm-${this.id || 'multi-mathfield'}-${name}`
    const vertical = fieldOptions.vertical ?? false
    qcm.setAttribute('data-vertical', String(vertical))

    choices.forEach((choice, index) => {
      const value = choiceValue(choice)
      const id = `${inputName}-${index}`
      const item = document.createElement('span')

      const input = document.createElement('input')
      input.type = 'radio'
      input.id = id
      input.name = inputName
      input.value = value
      input.disabled = !this.interactivityOn
      input.className = 'align-middle'
      item.appendChild(input)

      const label = document.createElement('label')
      label.htmlFor = id
      label.innerHTML = choiceHtml(choice)
      item.appendChild(label)
      qcm.appendChild(item)
    })

    return qcm
  }

  render() {
    const template = (this.getAttribute('data-template') || '').replaceAll(
      '<br>',
      '\n',
    )
    const rawOptionsAttr = this.getAttribute('data-options') || '%7B%7D'
    let options
    try {
      options = JSON.parse(decodeURIComponent(rawOptionsAttr))
    } catch (e) {
      console.error(
        '[MultiMathfield] Erreur JSON.parse sur data-options:',
        decodeURIComponent(rawOptionsAttr),
        e,
      )
      throw e
    }
    if (!this.interactivityOn) {
      this.contentHost.innerHTML = MultiMathfieldElement.renderStaticTemplate(
        template,
        options,
        'html',
        (fieldOptions) => {
          if (!fieldOptions.ldots) return ''
          return ' ... '
        },
        `labelEx${this.getAttribute('numero-exercice') ?? 0}Q${this.getAttribute('question-index') ?? 0}R`,
      )
      return
    }
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
    // Regex qui détecte $...$, %{champ}, \n ou texte
    const regex = /(\$[^$]+\$|%\{[^}]+\}|\n)/g
    let lastIndex = 0
    let match
    // On commence avec un span courant
    let currentSpan = document.createElement('span')
    currentSpan.style.display = 'inline-block'
    const container = document.createElement('span')
    container.style.display = 'inline-block'
    container.style.verticalAlign = 'top'
    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        // Stylise les items a), b), ... dans le texte brut
        const rawText = template.slice(lastIndex, match.index)
        // On utilise innerHTML pour insérer le HTML stylisé
        const temp = document.createElement('span')
        temp.innerHTML = stylizeItems(rawText)
        Array.from(temp.childNodes).forEach((node) =>
          currentSpan.appendChild(node),
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
        const fieldOptions: MultiMathfieldOption = options[name] ?? {}
        if (
          Array.isArray(fieldOptions.choices) &&
          fieldOptions.choices.length > 0
        ) {
          // Le champ est une liste déroulante et non un MathLive.
          const liste = this.createListeDeroulante(name, fieldOptions)
          const checkSpanListe = document.createElement('span')
          checkSpanListe.id =
            'check-' + (this.id ? this.id : 'multi-mathfield') + '-' + name
          currentSpan.appendChild(liste)
          if (fieldOptions.texteApres) {
            const texteApresListe = document.createElement('span')
            texteApresListe.style.marginLeft = '0'
            texteApresListe.innerHTML = fieldOptions.texteApres
            currentSpan.appendChild(texteApresListe)
          }
          currentSpan.appendChild(checkSpanListe)
          lastIndex = regex.lastIndex
          continue
        }
        if (Array.isArray(fieldOptions.qcm) && fieldOptions.qcm.length > 0) {
          const qcm = this.createQcm(name, fieldOptions)
          const checkSpanQcm = document.createElement('span')
          checkSpanQcm.id =
            'check-' + (this.id ? this.id : 'multi-mathfield') + '-' + name
          currentSpan.appendChild(qcm)
          if (fieldOptions.texteApres) {
            const texteApresQcm = document.createElement('span')
            texteApresQcm.style.marginLeft = '0'
            texteApresQcm.innerHTML = fieldOptions.texteApres
            currentSpan.appendChild(texteApresQcm)
          }
          currentSpan.appendChild(checkSpanQcm)
          lastIndex = regex.lastIndex
          continue
        }
        const div = document.createElement('DIV')
        div.style.display = 'inline-block'
        div.classList.add('ml-1')
        div.style.marginLeft = '2px'
        div.style.marginRight = '2px'
        div.style.marginTop = '0'
        div.style.marginBottom = '0'
        div.style.paddingTop = '0'
        div.style.paddingBottom = '0'
        div.style.paddingLeft = '0'
        div.style.paddingRight = '0'
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
        mathfield.setAttribute('virtual-keyboard-mode', 'manual')
        mathfield.style.border = 'none'

        // mathfield.style.verticalAlign = 'middle'
        // mathfield.style.boxShadow =
        //   'inset 2px 2px 6px #ccc, inset -2px -2px 6px #fff'

        // Ajout gestionnaire TAB pour navigation globale entre tous les mathfields du DOM (y compris dans les shadowRoots)
        mathfield.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            // Fonction utilitaire pour collecter tous les mathfields du DOM et des shadowRoots
            function collectAllMathfields(): MathfieldElement[] {
              const mathfields = []
              // 1. Mathfields dans le document principal
              mathfields.push(
                ...Array.from(document.querySelectorAll('math-field')),
              )
              // 2. Mathfields dans les shadowRoots des MultiMathfieldElement
              const multiEls = Array.from(
                document.querySelectorAll('multi-mathfield'),
              )
              for (const el of multiEls) {
                if (el.shadowRoot) {
                  mathfields.push(
                    ...Array.from(el.shadowRoot.querySelectorAll('math-field')),
                  )
                }
              }
              return mathfields as MathfieldElement[]
            }
            const allMathfields = collectAllMathfields().filter(
              (mf) => !mf.readOnly,
            )
            // Trouver l'index du mathfield courant
            const current = e.target as MathfieldElement
            const idx = allMathfields.indexOf(current)
            let nextIdx
            if (!e.shiftKey) {
              nextIdx = (idx + 1) % allMathfields.length
            } else {
              nextIdx = (idx - 1 + allMathfields.length) % allMathfields.length
            }
            const next = allMathfields[nextIdx]
            if (next) {
              ;(next as HTMLElement).focus()
            }
          }
        })
        div.appendChild(mathfield)
        let texteApres: HTMLElement | null = null
        if (options[name] && options[name].texteApres) {
          texteApres = document.createElement('span')
          texteApres.style.marginLeft = '0'
          texteApres.innerHTML = options[name].texteApres // On met le LaTeX brut dans le span, renderMathInElement va le transformer
        }

        // Ajoute un span de vérification après chaque Mathfield

        const checkSpan = document.createElement('span')
        checkSpan.id = 'check-' + mathfield.id
        currentSpan.appendChild(div)
        if (texteApres) {
          currentSpan.appendChild(texteApres)
        }
        currentSpan.appendChild(checkSpan)

        if (mathfield.isConnected) {
          setMathfield(mathfield)
        } else {
          mathfield.addEventListener('mount', setMathfieldListener, {
            once: true,
          })
        }
      } else if (token.startsWith('$')) {
        const span = document.createElement('span')
        span.textContent = token // On met le LaTeX brut dans le span, renderMathInElement va le transformer
        currentSpan.appendChild(span)
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < template.length) {
      // Stylise les items a), b), ... dans le texte brut restant
      const rawText = template.slice(lastIndex)
      const temp = document.createElement('span')
      temp.innerHTML = stylizeItems(rawText)
      Array.from(temp.childNodes).forEach((node) =>
        currentSpan.appendChild(node),
      )
    }
    // Ajoute le dernier span s'il n'est pas vide
    if (currentSpan.childNodes.length > 0) {
      container.appendChild(currentSpan)
    }

    // On ne remplace que le contenu, les styles du shadowRoot restent en place.
    this.contentHost.replaceChildren(container)
    try {
      renderKatexInElement(this.contentHost)
    } catch (error) {
      window.notify('Erreur lors du rendu KaTeX du multi-mathfield.', {
        error,
      })
    }
  }

  getValue() {
    const result: MultiMathfieldAnswers = {}
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll('math-field').forEach((el) => {
        const mf = el as MathfieldElement
        const name = mf.getAttribute('data-name')
        if (name) {
          result[name] = mf.value
        }
      })
      this.shadowRoot.querySelectorAll('liste-deroulante').forEach((el) => {
        const liste = el as ListeDeroulanteElement
        const name = liste.getAttribute('data-name')
        if (name) {
          result[name] = liste.value ?? ''
        }
      })
      this.shadowRoot.querySelectorAll('[data-type="qcm"]').forEach((el) => {
        const qcm = el as HTMLElement
        const name = qcm.getAttribute('data-name')
        const checked = qcm.querySelector<HTMLInputElement>(
          'input[type="radio"]:checked',
        )
        if (name) {
          result[name] = checked?.value ?? ''
        }
      })
    }
    return result
  }

  get value(): string {
    return JSON.stringify(this.getValue())
  }

  update(answers: MultiMathfieldAnswers | string) {
    let parsedAnswers: MultiMathfieldAnswers
    if (typeof answers === 'string') {
      // Format attendu: filledDataTemplate fabriqué par MultiMathfieldElement.verifQuestion
      parsedAnswers = MultiMathfieldElement.answersFromFilledTemplate(answers)

      // Compatibilité avec un éventuel ancien format JSON.stringify
      if (Object.keys(parsedAnswers).length === 0) {
        try {
          parsedAnswers = JSON.parse(answers)
        } catch {
          return
        }
      }
    } else {
      parsedAnswers = answers
    }
    this.setAnswers(parsedAnswers)
  }

  set value(answers: MultiMathfieldAnswers | string) {
    this.update(answers)
  }

  getSpansResultats() {
    const result: Record<string, HTMLElement> = {}
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll('span[id^="check-"]').forEach((el) => {
        const id = el.id
        const name = id.split('-')[2]
        result[name] = el as HTMLElement
      })
    }
    return result
  }

  setAnswers(answers: MultiMathfieldAnswers) {
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll('math-field').forEach((el) => {
        const mf = el as MathfieldElement
        const name = mf.getAttribute('data-name')
        if (name && answers[name] !== undefined) {
          mf.value = answers[name]
        }
      })
      this.shadowRoot.querySelectorAll('liste-deroulante').forEach((el) => {
        const liste = el as ListeDeroulanteElement
        const name = liste.getAttribute('data-name')
        if (name && answers[name] !== undefined) {
          liste.value = answers[name]
        }
      })
      this.shadowRoot.querySelectorAll('[data-type="qcm"]').forEach((el) => {
        const qcm = el as HTMLElement
        const name = qcm.getAttribute('data-name')
        if (name == null || answers[name] === undefined) return
        qcm
          .querySelectorAll<HTMLInputElement>('input[type="radio"]')
          .forEach((input) => {
            input.checked = input.value === answers[name]
          })
      })
    }
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): {
    isOk: boolean
    feedback: string
    score: { nbBonnesReponses: number; nbReponses: number }
  } {
    if (exercice.autoCorrection[i]?.valeur == null) {
      throw Error(
        `MultiMathfieldElement.verifQuestion appelé sur une question sans réponse: ${JSON.stringify(
          {
            exercice,
            question: i,
            autoCorrection: exercice.autoCorrection[i],
          },
        )}`,
      )
    }

    const multiId = `${this.elementTag}Ex${exercice.numeroExercice}Q${i}`
    const legacyMultiId = `multiMathfieldEx${exercice.numeroExercice}Q${i}`
    const multi = (document.getElementById(multiId) ??
      document.getElementById(legacyMultiId)) as HTMLElement | null
    const fieldIdPrefix = multi?.id ?? multiId
    const reponses = exercice.autoCorrection[i].valeur

    if (reponses == null) {
      window.notify(
        `MultiMathfieldElement.verifQuestion: reponses est null pour la question ${i} de l'exercice ${exercice.id}`,
        { exercice, i },
      )
      return {
        isOk: false,
        feedback: 'erreur dans le programme',
        score: { nbBonnesReponses: 0, nbReponses: 1 },
      }
    }

    if (typeof reponses !== 'object') {
      window.notify(
        `MultiMathfieldElement.verifQuestion: reponses n'est pas un objet pour la question ${i} de l'exercice ${exercice.id}`,
        { exercice, i, reponses },
      )
      return {
        isOk: false,
        feedback: 'erreur dans le programme',
        score: { nbBonnesReponses: 0, nbReponses: 1 },
      }
    }

    const bareme: (arg: number[]) => [number, number] =
      reponses.bareme ?? toutAUnPoint
    const feedbackFunction = reponses.feedback ?? undefined
    const variables = Object.entries(reponses).filter(
      ([key]) => key !== 'bareme' && key !== 'feedback',
    )
    const points = []
    const saisies: Record<string, string> = {}
    let compteurSaisiesVides = 0
    let compteurBonnesReponses = 0
    let noFeedback = false
    let feedback = ''
    const feedbackMessages = new Set<string>()

    for (const [field, reponse] of variables) {
      const options = reponse.options
      noFeedback = noFeedback || Boolean(options?.noFeedback)
      const compareFunction = reponse.compare ?? fonctionComparaison

      const liste = multi?.shadowRoot?.querySelector(
        `liste-deroulante[data-name="${field}"]`,
      ) as ListeDeroulanteElement | null
      if (liste != null) {
        // Champ « liste déroulante » : la comparaison est une simple égalité
        // avec la (ou l'une des) valeur(s) attendue(s).
        liste.interactivityOn = false
        const saisie = liste.value ?? ''
        const eltFeedbackListe = multi?.shadowRoot?.getElementById(
          `check-${fieldIdPrefix}-${field}`,
        ) as HTMLSpanElement | null
        if (saisie === '') {
          compteurSaisiesVides++
          points.push(0)
          continue
        }
        saisies[field] = saisie
        const attendues: unknown[] = Array.isArray(reponse.value)
          ? reponse.value
          : [reponse.value]
        const isOk = attendues.some((valeur) => String(valeur) === saisie)
        points.push(isOk ? 1 : 0)
        if (isOk) compteurBonnesReponses++
        if (eltFeedbackListe) {
          setStyles(eltFeedbackListe, 'marginBottom: 20px')
          eltFeedbackListe.innerHTML = isOk ? '😎' : '☹️'
        }
        continue
      }

      const qcm = multi?.shadowRoot?.querySelector(
        `[data-type="qcm"][data-name="${field}"]`,
      ) as HTMLElement | null
      if (qcm != null) {
        qcm
          .querySelectorAll<HTMLInputElement>('input[type="radio"]')
          .forEach((input) => {
            input.disabled = true
          })
        const saisie =
          qcm.querySelector<HTMLInputElement>('input[type="radio"]:checked')
            ?.value ?? ''
        const eltFeedbackQcm = multi?.shadowRoot?.getElementById(
          `check-${fieldIdPrefix}-${field}`,
        ) as HTMLSpanElement | null
        if (saisie === '') {
          compteurSaisiesVides++
          points.push(0)
          continue
        }
        saisies[field] = saisie
        const attendues: unknown[] = Array.isArray(reponse.value)
          ? reponse.value
          : [reponse.value]
        const isOk = attendues.some((valeur) => String(valeur) === saisie)
        points.push(isOk ? 1 : 0)
        if (isOk) compteurBonnesReponses++
        if (eltFeedbackQcm) {
          setStyles(eltFeedbackQcm, 'marginBottom: 20px')
          eltFeedbackQcm.innerHTML = isOk ? '😎' : '☹️'
        }
        continue
      }

      const mf = multi?.shadowRoot?.getElementById(
        `${fieldIdPrefix}-${field}`,
      ) as MathfieldElement | null
      if (mf == null) {
        points.push(0)
        continue
      }

      const saisie = mf.getValue()
      mf.readOnly = true
      mf.classList.add('corrected')
      if (saisie === '') {
        compteurSaisiesVides++
        points.push(0)
        continue
      }

      const eltFeedback = multi?.shadowRoot?.getElementById(
        `check-${fieldIdPrefix}-${field}`,
      ) as HTMLSpanElement | null
      if (eltFeedback) {
        setStyles(eltFeedback, 'marginBottom: 20px')
        eltFeedback.innerHTML = ''
      }

      saisies[field] = saisie
      let result
      if (Array.isArray(reponse.value)) {
        if (options.estDansIntervalle) {
          result = compareFunction(saisie, reponse.value, options)
        } else {
          let ii = 0
          while (!result?.isOk && ii < reponse.value.length) {
            result = compareFunction(saisie, reponse.value[ii], options)
            ii++
          }
        }
      } else {
        result = compareFunction(saisie, reponse.value, options)
      }

      if (result.isOk) {
        compteurBonnesReponses++
        points.push(this.scoreFromResult(result))
        if (eltFeedback) eltFeedback.innerHTML = '😎'
      } else {
        points.push(this.scoreFromResult(result))
        if (eltFeedback) eltFeedback.innerHTML = '☹️'
        if (result.feedback === 'saisieVide') result.feedback = ''
        else {
          result = {
            isOk: false,
            feedback: result.feedback ?? '',
          }
        }
      }

      mf.classList.add('corrected')
      if (result.feedback != null && result.feedback !== '') {
        for (const message of result.feedback.split('\n')) {
          if (message !== '') feedbackMessages.add(message)
        }
      }
    }

    feedback = Array.from(feedbackMessages)
      .map((message) => `${message}<br>`)
      .join('')

    if (compteurBonnesReponses === variables.length) {
      feedback = feedback ?? ''
    } else if (compteurSaisiesVides > 0) {
      feedback = `Il manque ${compteurSaisiesVides} réponse${compteurSaisiesVides > 1 ? 's' : ''}.`
    } else {
      feedback = feedback ?? `Certaines réponses sont incorrectes.`
    }

    if (feedbackFunction != null) {
      const feedbackFunctionResult = feedbackFunction(saisies)
      if (typeof feedbackFunctionResult === 'string') {
        feedback += feedbackFunctionResult
      }
    }

    const [nbBonnesReponses, nbReponses] = bareme(points)
    const spanReponseLigne = document.querySelector(
      `#resultatCheckEx${exercice.numeroExercice}Q${i}`,
    ) as HTMLSpanElement | null
    if (spanReponseLigne != null) {
      spanReponseLigne.innerHTML =
        compteurBonnesReponses === variables.length ? '😎' : '☹️'
    }

    exercice.answers ??= {}
    exercice.answers[multiId] =
      multi instanceof MultiMathfieldElement
        ? JSON.stringify(multi.getValue())
        : JSON.stringify(saisies)

    return {
      isOk: compteurBonnesReponses === variables.length,
      feedback: noFeedback ? '' : feedback !== '' ? feedback : '',
      score: {
        nbBonnesReponses,
        nbReponses,
      },
    }
  }

  static pointsMaxQuestion(exercice: IExercice, i: number): number {
    // `verifQuestion()` applique le barème à un point par champ, avec
    // `toutAUnPoint` par défaut.
    const valeur = exercice.autoCorrection?.[i]?.valeur
    return pointsMaxDuBareme(
      valeur?.bareme,
      compteChampsDeReponse(valeur),
      toutAUnPoint,
    )
  }
}

export function addMultiMathfield(
  exercice: IExercice,
  questionIndex: number,
  { dataTemplate, dataOptions, id }: MultiMathfieldOptions,
) {
  // Extraction des noms de champs %{name}
  const regex = /%\{([^}]+)\}/g
  let match
  const enrichedOptions: Record<string, MultiMathfieldOption> = {
    ...(dataOptions as Record<string, MultiMathfieldOption>),
  }
  while ((match = regex.exec(dataTemplate)) !== null) {
    const name = match[1]
    if (!(name in enrichedOptions)) {
      enrichedOptions[name] = {
        placeholder: '',
        minWidth: 30,
        keyboard: KeyboardType.clavierNumbers,
        ldots: false,
      }
    } else {
      // Ajoute les valeurs par défaut manquantes
      if (enrichedOptions[name].placeholder === undefined)
        enrichedOptions[name].placeholder = ''
      if (enrichedOptions[name].minWidth === undefined)
        enrichedOptions[name].minWidth = 30
      if (enrichedOptions[name].keyboard === undefined)
        enrichedOptions[name].keyboard = KeyboardType.clavierNumbers
      if (enrichedOptions[name].ldots === undefined) {
        enrichedOptions[name].ldots = false
      }
    }
  }
  if (context.isHtml && exercice.interactif && !context.isTypst) {
    registerMathaleaCustomElement(MultiMathfieldElement)
    return MultiMathfieldElement.create({
      id,
      numeroExercice: exercice.numeroExercice,
      questionIndex,
      dataTemplate,
      dataOptions: enrichedOptions,
    })
  } else {
    const output = context.isHtml ? 'html' : 'latex'
    const rendered = MultiMathfieldElement.renderStaticTemplate(
      dataTemplate,
      enrichedOptions,
      output,
      (fieldOptions) => {
        if (!fieldOptions.ldots) return ''
        return context.isHtml ? ' ... ' : '$\\ldots\\ldots$'
      },
      `labelEx${exercice.numeroExercice ?? 0}Q${questionIndex}R`,
    )

    if (!context.isHtml && !rendered.includes('\\begin{qcmprop}')) {
      const enumitemBlock = buildLatexEnumitemBlock(rendered.split('\n'))
      if (enumitemBlock) {
        return enumitemBlock
      }
    }

    return rendered
  }
}

registerMathaleaCustomElement(MultiMathfieldElement)
