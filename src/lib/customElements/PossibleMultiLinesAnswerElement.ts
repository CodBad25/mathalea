import Decimal from 'decimal.js'
import FractionEtendue from '../../modules/FractionEtendue'
import { context } from '../../modules/context'
import type { FonctionBareme } from '../interactif/baremeExercice'
import { buildDataKeyboardFromStyle } from '../interactif/claviers/keyboard'
import { fonctionComparaison } from '../interactif/comparisonFunctions'
import { verifySingleMathLiveField } from '../interactif/mathLiveVerifications'
import { ajouteFeedback } from '../interactif/questionMathLive'
import { renderKatex } from '../latex/renderKatex'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'
import {
  MathaleaMathfieldElement,
  type MathaleaMathfieldVerificationResult,
} from './MathaleaMathfield'

/**
 * - `toutOuRien` : la question rapporte les points du barème de la réponse
 *   (1 par défaut) seulement si le résultat et toutes les étapes sont justes.
 * - `etapes` : 2 points si tout est juste, 1 point si le résultat est juste
 *   malgré une étape fausse. Chaque ligne ajoutée est corrigée immédiatement
 *   puis verrouillée : l'élève corrige une étape fausse sur la ligne suivante.
 */
export type BaremeMultiLignes = 'toutOuRien' | 'etapes'

export type PossibleMultiLinesAnswerOptions = {
  /** Début de chaque ligne, en LaTeX sans dollars (par exemple `A =`). */
  prefix?: string
  /** Style du champ, comme pour `ajouteChampTexteMathLive()` (clavier, classes CSS). */
  style?: string
  bareme?: BaremeMultiLignes
  id?: string
}

type PossibleMultiLinesAnswerCreateOptions = PossibleMultiLinesAnswerOptions & {
  numeroExercice: number
  questionIndex: number
}

/** Barème de la réponse finale en mode `etapes` : 2 points si elle est juste. */
const baremeEtapes: FonctionBareme = (points) => [2 * (points[0] ?? 0), 2]

const STYLE_ID = 'possible-multi-lines-answer-style'
const ICONE_AJOUT =
  '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="8.5"/><path d="M10 6v8M6 10h8"/></svg>'

/**
 * Champ de réponse MathLive auquel l'élève peut ajouter autant de lignes
 * intermédiaires qu'il le souhaite (bouton « + »), pour rédiger un calcul en
 * plusieurs étapes.
 *
 * La dernière ligne est le champ standard `champTexteEx…Q…` : elle est vérifiée
 * exactement comme avec `ajouteChampTexteMathLive()` (options de comparaison,
 * barème, feedback). Chaque ligne intermédiaire non vide doit seulement être
 * égale à la réponse attendue, quelle que soit sa forme (voir
 * `BaremeMultiLignes` pour la notation).
 *
 * `value` est la liste de toutes les lignes, la dernière étant la réponse finale.
 */
export class PossibleMultiLinesAnswerElement extends MathaleaCustomElement {
  static readonly elementTag = 'possible-multi-lines-answer'

  /** Exercice de chaque élément, pour corriger les étapes dès leur ajout. */
  private static readonly questions = new Map<
    string,
    { exercice: IExercice; questionIndex: number }
  >()

  private pendingLines: string[] | null = null
  private lineCounter = 0

  static create({
    id,
    numeroExercice,
    questionIndex,
    prefix = '',
    style = '',
    bareme = 'toutOuRien',
  }: PossibleMultiLinesAnswerCreateOptions): string {
    if (!context.isHtml) return ''
    const tag = PossibleMultiLinesAnswerElement.elementTag
    const computedId = id ?? `${tag}Ex${numeroExercice}Q${questionIndex}`
    const dataKeyboard = buildDataKeyboardFromStyle(style).join(' ')
    const mathfield = MathaleaMathfieldElement.create({
      numeroExercice,
      questionIndex,
      dataKeyboard,
      className: style,
    })
    const attrs = this.buildAttributes({
      id: computedId,
      numeroExercice,
      questionIndex,
      prefix,
      dataKeyboard,
      className: style,
      bareme,
    })
    const finalLine = `<div class="pmla-line" data-pmla-final>${labelHtml(prefix)}${mathfield}<span id="resultatCheckEx${numeroExercice}Q${questionIndex}"></span><button type="button" class="pmla-add" data-pmla-add title="Ajouter une ligne" aria-label="Ajouter une ligne">${ICONE_AJOUT}</button></div>`
    return `<${tag}${attrs}><div data-pmla-lines></div>${finalLine}</${tag}>`
  }

  static verifQuestion(
    exercice: IExercice,
    i: number,
  ): MathaleaMathfieldVerificationResult {
    const element = document.querySelector(
      `#${PossibleMultiLinesAnswerElement.elementTag}Ex${exercice.numeroExercice}Q${i}`,
    ) as PossibleMultiLinesAnswerElement | null
    if (element == null)
      return MathaleaMathfieldElement.verifQuestion(exercice, i)

    const lignesFausses: number[] = []
    element.intermediateLines().forEach((line, k) => {
      if (element.corrigeLigne(line, exercice, i) === false)
        lignesFausses.push(k + 1)
    })

    const lines = element.value
    if (lines.length > 1 && typeof exercice.answers === 'object') {
      exercice.answers[element.id] = JSON.stringify(lines)
    }
    const finalField = element.finalMathfield()
    const resultatFinal = verifySingleMathLiveField(
      exercice,
      i,
      finalField?.querySelector('math-field') ?? null,
    )
    element.interactivityOn = false
    if (lignesFausses.length === 0) return resultatFinal

    // Le smiley signifie « tout est réussi » : avec une étape fausse, un
    // résultat final juste reçoit une simple coche, comme les autres étapes.
    if (resultatFinal.isOk) {
      const span = element.querySelector(
        `#resultatCheckEx${exercice.numeroExercice}Q${i}`,
      )
      if (span != null) {
        span.textContent = '✓'
        span.className = 'pmla-ok'
      }
    }

    const feedbackLignes =
      lignesFausses.length === 1
        ? `La ligne ${lignesFausses[0]} n'est pas égale à l'expression de départ.`
        : `Les lignes ${lignesFausses.slice(0, -1).join(', ')} et ${lignesFausses.at(-1)} ne sont pas égales à l'expression de départ.`
    const unPointPourLeResultat =
      element.baremeEtapes && resultatFinal.isOk ? 1 : 0
    return {
      isOk: false,
      feedback: [feedbackLignes, resultatFinal.feedback]
        .filter((feedback) => feedback !== '')
        .join('<br>'),
      score: {
        nbBonnesReponses: unPointPourLeResultat,
        nbReponses: resultatFinal.score.nbReponses,
      },
    }
  }

  static pointsMaxQuestion(exercice: IExercice, i: number): number {
    return MathaleaMathfieldElement.pointsMaxQuestion(exercice, i)
  }

  static formatStudentAnswer(rawAnswer: string): string {
    const lines = parseLines(rawAnswer)
    if (lines == null) return `$${rawAnswer}$`
    return lines.map((line) => `$${line}$`).join('<br>')
  }

  static stripFromQuestionHtml(questionHtml: string): string {
    return MathaleaMathfieldElement.stripFromQuestionHtml(
      super.stripFromQuestionHtml(questionHtml),
    ).replace(/<button[^>]*data-pmla-add[^>]*>[\s\S]*?<\/button>/gi, '')
  }

  static registerQuestion(
    id: string,
    exercice: IExercice,
    questionIndex: number,
  ): void {
    PossibleMultiLinesAnswerElement.questions.set(id, {
      exercice,
      questionIndex,
    })
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render(): string | void {
    injectStyle()
    const addButton = this.querySelector<HTMLButtonElement>('[data-pmla-add]')
    if (addButton != null && addButton.dataset.listenerAdded !== 'true') {
      addButton.addEventListener('click', () => this.addLine())
      addButton.dataset.listenerAdded = 'true'
    }
    if (this.pendingLines != null) {
      const lines = this.pendingLines
      this.pendingLines = null
      this.applyLines(lines)
    }
    this.onInteractivityChanged(this.interactivityOn)
  }

  get value(): string[] {
    if (this.finalMathfield() == null) return this.pendingLines ?? []
    const lines = this.intermediateLines().map(
      (line) =>
        (
          line.querySelector(
            MathaleaMathfieldElement.elementTag,
          ) as MathaleaMathfieldElement | null
        )?.value ?? '',
    )
    lines.push(this.finalMathfield()?.value ?? '')
    return lines.length === 1 && lines[0] === '' ? [] : lines
  }

  set value(nextValue: string[] | string) {
    this.update(nextValue)
  }

  update(nextValue: string[] | string): void {
    const lines =
      typeof nextValue === 'string' ? parseLines(nextValue) : nextValue
    if (lines == null || !lines.every((line) => typeof line === 'string'))
      return
    if (this.finalMathfield() == null) {
      this.pendingLines = [...lines]
      return
    }
    this.applyLines(lines)
  }

  protected onInteractivityChanged(isOn: boolean): void {
    this.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.hidden = !isOn
    })
    this.intermediateLines().forEach((line) => {
      const field = line.querySelector<MathaleaMathfieldElement>(
        MathaleaMathfieldElement.elementTag,
      )
      if (field != null) field.readOnly = !isOn || this.baremeEtapes
    })
    const finalField = this.finalMathfield()
    if (finalField != null) finalField.readOnly = !isOn
  }

  private get baremeEtapes(): boolean {
    return this.getAttribute('bareme') === 'etapes'
  }

  /**
   * Marque une ligne intermédiaire juste (coche) ou fausse (croix, ligne
   * barée). Retourne `null` pour une ligne vide ou impossible à corriger.
   */
  private corrigeLigne(
    line: HTMLElement,
    exercice: IExercice,
    questionIndex: number,
  ): boolean | null {
    const field = line.querySelector<MathaleaMathfieldElement>(
      MathaleaMathfieldElement.elementTag,
    )
    const span = line.querySelector('[data-pmla-result]')
    const saisie = field?.value ?? ''
    if (saisie === '' || span == null) return null
    const expectedValues = valeursAttendues(exercice, questionIndex)
    const isOk =
      expectedValues.length === 0 ||
      expectedValues.some(
        (expected) => fonctionComparaison(saisie, expected).isOk,
      )
    span.textContent = isOk ? '✓' : '✗'
    span.className = isOk ? 'pmla-ok' : 'pmla-ko'
    line.classList.toggle('pmla-barre', !isOk)
    return isOk
  }

  /** En mode `etapes`, corrige et verrouille une ligne dès son ajout. */
  private corrigeLigneImmediatement(line: HTMLElement): void {
    if (!this.baremeEtapes) return
    const question = PossibleMultiLinesAnswerElement.questions.get(this.id)
    if (question != null) {
      this.corrigeLigne(line, question.exercice, question.questionIndex)
    }
    const field = line.querySelector<MathaleaMathfieldElement>(
      MathaleaMathfieldElement.elementTag,
    )
    if (field != null) field.readOnly = true
  }

  private intermediateLines(): HTMLElement[] {
    return Array.from(
      this.querySelectorAll<HTMLElement>('[data-pmla-lines] > .pmla-line'),
    )
  }

  private finalMathfield(): MathaleaMathfieldElement | null {
    return this.querySelector(
      `[data-pmla-final] ${MathaleaMathfieldElement.elementTag}`,
    )
  }

  private applyLines(lines: string[]): void {
    this.intermediateLines().forEach((line) => line.remove())
    lines.slice(0, -1).forEach((line) => this.appendIntermediateLine(line))
    const finalField = this.finalMathfield()
    if (finalField != null) finalField.value = lines.at(-1) ?? ''
  }

  /** Recopie la dernière ligne au-dessus et vide la ligne finale. */
  private addLine(): void {
    const finalField = this.finalMathfield()
    if (finalField == null || !this.interactivityOn) return
    if (finalField.value === '') return
    this.appendIntermediateLine(finalField.value)
    finalField.value = ''
    finalField.focus()
  }

  private appendIntermediateLine(value: string): void {
    const container = this.querySelector('[data-pmla-lines]')
    if (container == null) return
    this.lineCounter++
    const line = document.createElement('div')
    line.className = 'pmla-line'
    // En mode `etapes`, une étape fausse ne doit pas pouvoir être effacée.
    const boutonSupprimer = this.baremeEtapes
      ? ''
      : '<button type="button" class="pmla-remove" title="Supprimer cette ligne" aria-label="Supprimer cette ligne">×</button>'
    line.innerHTML = `${labelHtml(this.getAttribute('prefix') ?? '')}<span data-pmla-result></span>${boutonSupprimer}`
    const field = document.createElement(
      MathaleaMathfieldElement.elementTag,
    ) as MathaleaMathfieldElement
    field.setAttribute(
      'mathfield-id',
      `champTexteEx${this.getAttribute('numero-exercice')}Q${this.getAttribute('question-index')}Etape${this.lineCounter}`,
    )
    field.setAttribute(
      'data-keyboard',
      this.getAttribute('data-keyboard') ?? '',
    )
    field.setAttribute('class-name', this.getAttribute('class-name') ?? '')
    line.querySelector('label')?.after(field)
    line
      .querySelector('.pmla-remove')
      ?.addEventListener('click', () => line.remove())
    container.append(line)
    field.value = value
    const label = line.querySelector('label')
    if (label != null) renderKatex(label)
    this.corrigeLigneImmediatement(line)
  }
}

function labelHtml(prefix: string): string {
  return prefix === '' ? '' : `<label>$${prefix}$</label>`
}

function parseLines(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      !Array.isArray(parsed) ||
      !parsed.every((line) => typeof line === 'string')
    )
      return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Valeurs, en LaTeX, auxquelles chaque ligne intermédiaire doit être égale.
 * Une liste vide signifie que les lignes intermédiaires ne sont pas contrôlées.
 */
function valeursAttendues(exercice: IExercice, i: number): string[] {
  const value = exercice.autoCorrection[i]?.valeur?.reponse?.value
  if (value == null) return []
  return (Array.isArray(value) ? value : [value]).flatMap((v: unknown) => {
    if (typeof v === 'number') return [String(v)]
    if (typeof v === 'string') return [v]
    if (v instanceof FractionEtendue) return [v.texFraction]
    if (v instanceof Decimal) return [v.toString()]
    return []
  })
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID) != null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    possible-multi-lines-answer { display: block; }
    possible-multi-lines-answer .pmla-line { display: flex; align-items: center; gap: .25rem; margin: .25rem 0; }
    possible-multi-lines-answer button { display: inline-flex; align-items: center; border: none; background: transparent; color: #9ca3af; cursor: pointer; font-size: 1.1rem; line-height: 1; padding: .1rem; border-radius: 999px; }
    possible-multi-lines-answer button:hover, possible-multi-lines-answer button:focus-visible { color: #4b5563; }
    possible-multi-lines-answer .pmla-ok, possible-multi-lines-answer .pmla-ko { font-size: .9rem; font-weight: 600; margin-left: .15rem; }
    possible-multi-lines-answer .pmla-ok { color: #16a34a; }
    possible-multi-lines-answer .pmla-ko { color: #dc2626; }
    possible-multi-lines-answer .pmla-barre math-field { background-image: linear-gradient(to top right, transparent calc(50% - .75px), #dc2626 calc(50% - .75px), #dc2626 calc(50% + .75px), transparent calc(50% + .75px)); }
  `
  document.head.append(style)
}

/**
 * Ajoute un champ de réponse MathLive auquel l'élève peut ajouter des lignes
 * intermédiaires (voir `PossibleMultiLinesAnswerElement`).
 *
 * À appeler après `handleAnswers()` : la réponse attendue est lue dans
 * `exercice.autoCorrection[questionIndex].valeur.reponse`, et le mode
 * `etapes` y remplace le barème (2 points).
 */
export function addPossibleMultiLinesAnswer(
  exercice: IExercice,
  questionIndex: number,
  options: PossibleMultiLinesAnswerOptions = {},
): string {
  if (!context.isHtml || !exercice.interactif) return ''
  const autoCorrection = (exercice.autoCorrection[questionIndex] ??= {})
  autoCorrection.formatInteractif = PossibleMultiLinesAnswerElement.elementTag
  if (options.bareme === 'etapes' && autoCorrection.valeur != null) {
    autoCorrection.valeur.bareme = baremeEtapes
  }
  const numeroExercice = exercice.numeroExercice ?? 0
  PossibleMultiLinesAnswerElement.registerQuestion(
    options.id ??
      `${PossibleMultiLinesAnswerElement.elementTag}Ex${numeroExercice}Q${questionIndex}`,
    exercice,
    questionIndex,
  )
  return (
    PossibleMultiLinesAnswerElement.create({
      ...options,
      numeroExercice,
      questionIndex,
    }) + ajouteFeedback(exercice, questionIndex)
  )
}

registerMathaleaCustomElement(PossibleMultiLinesAnswerElement)
