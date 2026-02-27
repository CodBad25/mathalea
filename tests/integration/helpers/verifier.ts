import { verifQuestionCliqueFigure } from '../../../src/lib/interactif/cliqueFigure'
import { verifDragAndDrop } from '../../../src/lib/interactif/DragAndDrop'
import { verifQuestionMetaInteractif2d } from '../../../src/lib/interactif/gestionInteractif'
import { verifQuestionMathLive } from '../../../src/lib/interactif/mathLive'
import { verifQuestionQcm } from '../../../src/lib/interactif/qcm'
import { verifQuestionListeDeroulante } from '../../../src/lib/interactif/questionListeDeroulante'
import { verifQuestionSvgSelection } from '../../../src/lib/interactif/questionSvgSelection/questionSvgSelection'
import { verifQuestionTableur } from '../../../src/lib/tableur/outilsTableur'
import type { IDragAndDrop, IExercice } from '../../../src/lib/types'
import Grandeur from '../../../src/modules/Grandeur'
import {
  injectCliqueFigureDOM,
  injectDndDOM,
  injectFillInTheBlankDOM,
  injectListeDeroulanteDOM,
  injectMathLiveDOM,
  injectMetaInteractif2dDOM,
  injectQcmDOM,
  injectSvgSelectionDOM,
  injectTableurDOM,
  injectTableauMathliveDOM,
} from './domSimulator'

/**
 * Converts a Grandeur string like "7,5\u202fcm^2" to the LaTeX format
 * that unitsCompare/inputToGrandeur expects: "7,5\\operatorname{cm^2}"
 */
function grandeurStringToLatex(value: string): string {
  const cleaned = value.replace(/[\u202f\u00a0]/g, '')
  const g = Grandeur.fromString(cleaned)
  if (g.unite === '°C' || g.unite === '°') {
    return `${String(g.mesure).replace('.', ',')}${g.unite}`
  }
  return `${String(g.mesure).replace('.', ',')}\\operatorname{${g.unite}}`
}

/**
 * Converts scientific notation "1,5e3" or "1.5e-3" to LaTeX "1,5\\times10^{3}"
 * Handles both comma (French) and dot decimal separators.
 * Returns the original string if it's not in e-notation.
 */
function eNotationToLatex(value: string): string {
  const match = value.match(/^(-?\d+(?:[.,]\d+)?)e([+-]?\d+)$/)
  if (!match) return value
  const mantissa = match[1].replace('.', ',')
  const exponent = match[2].replace(/^\+/, '')
  return `${mantissa}\\times10^{${exponent}}`
}

function pgcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

function simplifyFractionLatex(value: string): string {
  const cleaned = value.replace(/\s+/g, '')
  let match = cleaned.match(/^\\d?frac{(-?\d+)}{(-?\d+)}$/)
  if (!match) {
    match = cleaned.match(/^(-?\d+)\/(-?\d+)$/)
  }
  if (!match) return value

  let num = parseInt(match[1], 10)
  let den = parseInt(match[2], 10)
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return value
  if (den < 0) {
    num = -num
    den = -den
  }
  const d = pgcd(num, den)
  if (d <= 1) return value
  return `\\frac{${num / d}}{${den / d}}`
}

function scientificPowerToLatex(value: string): string {
  const cleaned = value.replace(/\s+/g, '')
  if (cleaned.includes('\\times')) return value
  const match = cleaned.match(/^(-?)10\^(\{?-?\d+\}?)$/)
  if (!match) return value
  const mantissa = match[1] === '-' ? '-1' : '1'
  return `${mantissa}\\times10^${match[2]}`
}

/**
 * Converts an interval string like "]1;2[" or "[3,5;4,5]" to a numeric point
 * inside the interval (midpoint), as expected by interval comparisons.
 */
function intervalToMidpoint(value: string): string | null {
  const match = value.match(/[[\]](.+);(.+)[[\]]/)
  if (!match) return null
  const lo = parseFloat(match[1].replace(',', '.'))
  const hi = parseFloat(match[2].replace(',', '.'))
  if (isNaN(lo) || isNaN(hi)) return null
  return String((lo + hi) / 2)
}

type CliqueFigureItem = { id: string; solution: boolean }
type DndAnswer = {
  value?: string | string[]
  options?: { multi?: boolean }
}
type DndValeur = Record<string, DndAnswer>

function isCliqueFigureItem(value: unknown): value is CliqueFigureItem {
  if (typeof value !== 'object' || value == null) return false
  const candidate: Partial<CliqueFigureItem> = value
  return (
    typeof candidate.id === 'string' && typeof candidate.solution === 'boolean'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null
}

function toDndValeur(value: unknown): DndValeur {
  const out: DndValeur = {}
  if (!isRecord(value)) return out
  for (const [key, answer] of Object.entries(value)) {
    if (!/^rectangle\d+$/.test(key)) continue
    if (!isRecord(answer)) continue
    const normalized: DndAnswer = {}
    if (typeof answer.value === 'string' || Array.isArray(answer.value)) {
      normalized.value = answer.value
    }
    if (isRecord(answer.options) && 'multi' in answer.options) {
      if (typeof answer.options.multi === 'boolean') {
        normalized.options = { multi: answer.options.multi }
      }
    }
    out[key] = normalized
  }
  return out
}

function ensureDragAndDropQuestion(exercice: IExercice, questionIndex: number) {
  if (!Array.isArray(exercice.dragAndDrops)) {
    exercice.dragAndDrops = []
  }
  const existing = exercice.dragAndDrops[questionIndex]
  if (existing != null) {
    if (!Array.isArray(existing.listeners)) {
      existing.listeners = []
    }
    return
  }
  const fallback: IDragAndDrop = {
    exercice,
    question: questionIndex,
    consigne: '',
    etiquettes: [],
    enonceATrous: '',
    listeners: [],
    ajouteDragAndDrop() {
      return ''
    },
  }
  exercice.dragAndDrops[questionIndex] = fallback
}

export interface VerificationResult {
  questionIndex: number
  format: string
  isOk: boolean
  feedback: string
  skipped: boolean
  skipReason?: string
}

/**
 * Verifies all questions of an exercise by:
 * 1. Reading autoCorrection to get expected answers
 * 2. Injecting the correct answer into fake DOM
 * 3. Calling the real verification function
 * 4. Checking the result
 */
export function verifyAllQuestions(exercice: IExercice): VerificationResult[] {
  const results: VerificationResult[] = []

  for (let i = 0; i < exercice.autoCorrection.length; i++) {
    const ac = exercice.autoCorrection[i]
    const format = ac?.reponse?.param?.formatInteractif ?? 'mathlive'
    const valeur = ac?.reponse?.valeur
    const exIdx = exercice.numeroExercice ?? 0

    try {
      switch (format) {
        case 'mathlive':
        case 'texte': {
          if (
            valeur?.callback != null &&
            typeof valeur.callback === 'function'
          ) {
            results.push({
              questionIndex: i,
              format,
              isOk: true,
              feedback: '',
              skipped: true,
              skipReason: 'callback-based-verification',
            })
            break
          }
          const answer = valeur?.reponse?.value
          if (answer == null) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No answer value found',
              skipped: true,
              skipReason: 'no-answer-value',
            })
            break
          }
          const rawAnswer = Array.isArray(answer)
            ? String(answer[0])
            : String(answer)
          const options = valeur?.reponse?.options ?? {}
          let answerStr = rawAnswer
          if (options.unite) {
            answerStr = grandeurStringToLatex(rawAnswer)
          } else if (options.estDansIntervalle) {
            answerStr = intervalToMidpoint(rawAnswer) ?? rawAnswer
          } else if (options.ecritureScientifique) {
            answerStr = scientificPowerToLatex(eNotationToLatex(rawAnswer))
          } else if (options.fractionSimplifiee) {
            answerStr = simplifyFractionLatex(rawAnswer)
          }
          injectMathLiveDOM(exIdx, i, answerStr)
          const result = verifQuestionMathLive(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'fillInTheBlank': {
          if (!valeur) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No valeur',
              skipped: true,
              skipReason: 'no-valeur',
            })
            break
          }
          const champValues: Record<string, string> = {}
          for (const [key, answer] of Object.entries(valeur)) {
            if (key.startsWith('champ') && answer?.value != null) {
              const val = answer.value
              const raw = Array.isArray(val) ? String(val[0]) : String(val)
              const opts = answer.options ?? {}
              champValues[key] = opts.unite ? grandeurStringToLatex(raw) : raw
            }
          }
          if (Object.keys(champValues).length === 0) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No champ values',
              skipped: true,
              skipReason: 'no-champ-values',
            })
            break
          }
          injectFillInTheBlankDOM(exIdx, i, champValues)
          const result = verifQuestionMathLive(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'tableauMathlive': {
          if (!valeur) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No valeur',
              skipped: true,
              skipReason: 'no-valeur',
            })
            break
          }
          const cellValues: Record<string, string> = {}
          for (const [key, answer] of Object.entries(valeur)) {
            if (key.match(/^L\d+C\d+$/) && answer?.value != null) {
              const val = answer.value
              const raw = Array.isArray(val) ? String(val[0]) : String(val)
              const opts = answer.options ?? {}
              cellValues[key] = opts.unite ? grandeurStringToLatex(raw) : raw
            }
          }
          if (Object.keys(cellValues).length === 0) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No cell values',
              skipped: true,
              skipReason: 'no-cell-values',
            })
            break
          }
          injectTableauMathliveDOM(exIdx, i, cellValues)
          const result = verifQuestionMathLive(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'qcm': {
          const propositions = ac.propositions
          if (!propositions || propositions.length === 0) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No propositions',
              skipped: true,
              skipReason: 'no-propositions',
            })
            break
          }
          injectQcmDOM(exIdx, i, propositions)
          const result = verifQuestionQcm(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result === 'OK',
            feedback: '',
            skipped: false,
          })
          break
        }

        case 'listeDeroulante': {
          const dropdownAnswer = valeur?.reponse?.value
          if (dropdownAnswer == null) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No dropdown value',
              skipped: true,
              skipReason: 'no-dropdown-value',
            })
            break
          }
          const answerStr = Array.isArray(dropdownAnswer)
            ? String(dropdownAnswer[0])
            : String(dropdownAnswer)
          injectListeDeroulanteDOM(exIdx, i, answerStr)
          const result = verifQuestionListeDeroulante(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result === 'OK',
            feedback: '',
            skipped: false,
          })
          break
        }

        case 'svgSelection': {
          const selectionValue = valeur?.reponse?.value
          if (selectionValue == null) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No svgSelection value',
              skipped: true,
              skipReason: 'no-svgSelection-value',
            })
            break
          }
          const answerStr = Array.isArray(selectionValue)
            ? String(selectionValue[0])
            : String(selectionValue)
          injectSvgSelectionDOM(exIdx, i, answerStr)
          const result = verifQuestionSvgSelection(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result === 'OK',
            feedback: '',
            skipped: false,
          })
          break
        }

        case 'MetaInteractif2d': {
          if (!valeur) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No valeur',
              skipped: true,
              skipReason: 'no-valeur',
            })
            break
          }
          const fieldValues: Record<string, string> = {}
          for (const [key, answer] of Object.entries(valeur)) {
            if (key.match(/^field\d+$/) && answer?.value != null) {
              const val = answer.value
              const raw = Array.isArray(val) ? String(val[0]) : String(val)
              const opts = answer.options ?? {}
              fieldValues[key] = opts.unite ? grandeurStringToLatex(raw) : raw
            }
          }
          if (Object.keys(fieldValues).length === 0) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No field values',
              skipped: true,
              skipReason: 'no-field-values',
            })
            break
          }
          injectMetaInteractif2dDOM(exIdx, i, fieldValues)
          const result = verifQuestionMetaInteractif2d(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'cliqueFigure': {
          if (exercice.figures == null || !Array.isArray(exercice.figures[i])) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No cliqueFigure figures',
              skipped: true,
              skipReason: 'no-figures',
            })
            break
          }

          const figures: CliqueFigureItem[] = []
          for (const candidate of exercice.figures[i] as unknown[]) {
            if (isCliqueFigureItem(candidate)) {
              figures.push(candidate)
            }
          }
          if (figures.length === 0) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No cliqueFigure figures',
              skipped: true,
              skipReason: 'no-figures',
            })
            break
          }

          injectCliqueFigureDOM(exIdx, i, figures)
          if (
            'callback' in exercice &&
            typeof exercice.callback === 'function'
          ) {
            exercice.callback(exercice, i)
          }
          const result = verifQuestionCliqueFigure(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result === 'OK',
            feedback: '',
            skipped: false,
          })
          break
        }

        case 'dnd': {
          if (!valeur) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No valeur',
              skipped: true,
              skipReason: 'no-valeur',
            })
            break
          }
          injectDndDOM(exIdx, i, toDndValeur(valeur))
          ensureDragAndDropQuestion(exercice, i)
          const result = verifDragAndDrop(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'tableur': {
          const sheetAnswer = valeur?.sheetAnswer
          if (!sheetAnswer) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'No sheetAnswer',
              skipped: true,
              skipReason: 'no-sheet-answer',
            })
            break
          }
          const goodAnswers = sheetAnswer.goodAnswerFormulas
          const testDatas = sheetAnswer.sheetTestDatas
          if (!Array.isArray(goodAnswers) || !Array.isArray(testDatas)) {
            results.push({
              questionIndex: i,
              format,
              isOk: false,
              feedback: 'Invalid tableur test data',
              skipped: true,
              skipReason: 'invalid-sheet-answer-data',
            })
            break
          }

          injectTableurDOM(exIdx, i, goodAnswers, testDatas)
          const result = verifQuestionTableur(exercice, i)
          results.push({
            questionIndex: i,
            format,
            isOk: result?.isOk === true,
            feedback: result?.feedback ?? '',
            skipped: false,
          })
          break
        }

        case 'custom':
          results.push({
            questionIndex: i,
            format,
            isOk: true,
            feedback: '',
            skipped: true,
            skipReason: `format-${format}-not-supported`,
          })
          break

        default:
          results.push({
            questionIndex: i,
            format: format ?? 'unknown',
            isOk: false,
            feedback: `Unknown format: ${format}`,
            skipped: true,
            skipReason: 'unknown-format',
          })
      }
    } catch (error) {
      results.push({
        questionIndex: i,
        format,
        isOk: false,
        feedback: error instanceof Error ? error.message : String(error),
        skipped: false,
      })
    }
  }

  return results
}

/**
 * Bypass DOM entirely: directly call the comparison function with the expected answer.
 * Tests that the comparison function accepts the exercise's own answer.
 */
export function verifyComparisonOnly(
  exercice: IExercice,
): VerificationResult[] {
  const results: VerificationResult[] = []

  for (let i = 0; i < exercice.autoCorrection.length; i++) {
    const ac = exercice.autoCorrection[i]
    const format = ac?.reponse?.param?.formatInteractif ?? 'mathlive'
    const valeur = ac?.reponse?.valeur

    // Only works for mathlive-like formats with a compare function
    if (
      ![
        'mathlive',
        'texte',
        'fillInTheBlank',
        'tableauMathlive',
        'MetaInteractif2d',
        'svgSelection',
        undefined,
      ].includes(format)
    ) {
      results.push({
        questionIndex: i,
        format,
        isOk: true,
        feedback: '',
        skipped: true,
        skipReason: `format-${format}-not-supported`,
      })
      continue
    }

    if (!valeur) {
      results.push({
        questionIndex: i,
        format,
        isOk: false,
        feedback: 'No valeur',
        skipped: true,
        skipReason: 'no-valeur',
      })
      continue
    }

    if (format === 'svgSelection') {
      const selectionValue = valeur.reponse?.value
      if (selectionValue == null) {
        results.push({
          questionIndex: i,
          format,
          isOk: false,
          feedback: 'No svgSelection value',
          skipped: true,
          skipReason: 'no-svgSelection-value',
        })
      } else {
        results.push({
          questionIndex: i,
          format,
          isOk: true,
          feedback: '',
          skipped: false,
        })
      }
      continue
    }

    let allOk = true
    let failedField = ''
    for (const [key, answerObj] of Object.entries(valeur)) {
      if (
        key === 'bareme' ||
        key === 'feedback' ||
        typeof answerObj === 'function'
      ) {
        continue
      }
      const answer = answerObj
      if (!answer?.value || !answer?.compare) continue

      const value = Array.isArray(answer.value)
        ? String(answer.value[0])
        : String(answer.value)
      const options = answer.options ?? {}
      let compareValue = value
      if (options.unite) {
        const cleaned = value.replace(/[\u202f\u00a0]/g, '')
        const g = Grandeur.fromString(cleaned)
        if (g.unite === '°C' || g.unite === '°') {
          compareValue = `${String(g.mesure).replace('.', ',')}${g.unite}`
        } else {
          compareValue = `${String(g.mesure).replace('.', ',')}\\operatorname{${g.unite}}`
        }
      }
      if (options.estDansIntervalle) {
        const match = value.match(/[[\]](.+);(.+)[[\]]/)
        if (match) {
          const lo = parseFloat(match[1].replace(',', '.'))
          const hi = parseFloat(match[2].replace(',', '.'))
          if (!isNaN(lo) && !isNaN(hi)) {
            compareValue = String((lo + hi) / 2)
          }
        }
      }
      try {
        const result = answer.compare(compareValue, value, options)
        if (!result.isOk) {
          allOk = false
          failedField = key
        }
      } catch (e) {
        allOk = false
        failedField = `${key}(threw: ${e instanceof Error ? e.message : e})`
      }
    }

    results.push({
      questionIndex: i,
      format,
      isOk: allOk,
      feedback: allOk ? '' : `Failed field: ${failedField}`,
      skipped: false,
    })
  }

  return results
}
