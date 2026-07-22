// Utilitaire pour styliser les items a), b), ... dans un texte brut
import katexCss from 'katex/dist/katex.min.css?inline'
import { MathfieldElement } from 'mathlive'
import { context } from '../../modules/context'
import { bleuMathalea } from '../colors'
import { setStyles } from '../html/dom'
import {
  buildDataKeyboardFromStyle,
  KeyboardType,
} from '../interactif/claviers/keyboard'
import { fonctionComparaison } from '../interactif/comparisonFunctions'
import { toutAUnPoint } from '../interactif/fonctionsBaremes'
import { setMathfield, setMathfieldListener } from '../interactif/setMathfield'
import type { IExercice, ValeurNames } from '../types'
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
}

type MultiMathfieldAnswers = Record<string, string>
type MultiMathfieldOption = {
  keyboard?: string
  placeholder?: string
  minWidth?: number
  texteApres?: string
  ldots?: boolean
}

const buildDataKeyboardString = (style = '') => {
  const blocks = buildDataKeyboardFromStyle(style)
  return blocks.join(' ')
}

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
  }: MultiMathfieldCreateOptions): string {
    const computedId =
      id ??
      `${MultiMathfieldElement.elementTag}Ex${numeroExercice ?? 0}Q${questionIndex ?? 0}`
    const dataOptionsStr = encodeURIComponent(JSON.stringify(dataOptions))
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    const html = `<multi-mathfield id="${computedId}" data-template="${dataTemplate.replace(/"/g, '&quot;')}" data-options="${dataOptionsStr}"></multi-mathfield>`
    return `${html}<div class="ml-2 py-2 italic text-coopmaths-warn-darkest dark:text-coopmathsdark-warn-darkest" id="feedbackEx${numeroExercice ?? 0}Q${questionIndex ?? 0}" style="display: none;"></div>`
  }

  connectedCallback() {
    this.render()
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
    }
    return result
  }

  get value() {
    return this.getValue()
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
    const multi = document.getElementById(multiId) as HTMLElement | null
    const template = multi?.getAttribute('data-template')
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

      const mf = multi?.shadowRoot?.querySelector(
        `#${multiId}-${field}`,
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

      const eltFeedback = multi?.shadowRoot?.querySelector(
        `#check-${multiId}-${field}`,
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

    if (typeof exercice.answers === 'object' && exercice.answers !== null) {
      let filledTemplate = template ?? ''
      Object.entries(saisies).forEach(([champ, valeur]) => {
        const regex = new RegExp(`%\\{${champ}\\}`, 'g')
        filledTemplate = filledTemplate.replace(regex, `${valeur}`)
      })
      exercice.answers[multiId] = filledTemplate
    }

    return {
      isOk: compteurBonnesReponses === variables.length,
      feedback: noFeedback ? '' : feedback !== '' ? feedback : '',
      score: {
        nbBonnesReponses,
        nbReponses,
      },
    }
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
  if (context.isHtml && exercice.interactif) {
    registerMathaleaCustomElement(MultiMathfieldElement)
    return MultiMathfieldElement.create({
      id,
      numeroExercice: exercice.numeroExercice,
      questionIndex,
      dataTemplate,
      dataOptions: enrichedOptions,
    })
  } else {
    // On traite ligne par ligne pour détecter les items a), b), ... en début de ligne
    const lines = dataTemplate.split('\n')
    const fieldRegex = /%\{[^}]+\}/g
    const processedLines = lines.map((rawLine) => {
      let line = rawLine
      // Remplace les champs %{...} par $\ldots\ldots$ uniquement si ldots est à true
      line = line.replace(fieldRegex, (match) => {
        const fieldMatch = match.match(/%\{([^}]+)\}/)
        if (fieldMatch) {
          const fieldName = fieldMatch[1]
          if (enrichedOptions[fieldName] && enrichedOptions[fieldName].ldots) {
            return '$\\ldots\\ldots$'
          } else {
            return ''
          }
        }
        return match
      })
      return line
    })

    if (!context.isHtml) {
      const enumitemBlock = buildLatexEnumitemBlock(processedLines)
      if (enumitemBlock) {
        return enumitemBlock
      }
    }

    const renderedLines = processedLines.map((line) =>
      stylizeItems(line, context.isHtml ? 'html' : 'latex'),
    )

    return renderedLines.join('<br>')
  }
}

registerMathaleaCustomElement(MultiMathfieldElement)
