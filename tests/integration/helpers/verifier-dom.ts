import { verifQuestionCliqueFigure } from '../../../src/lib/interactif/cliqueFigure'
import { verifDragAndDrop } from '../../../src/lib/interactif/DragAndDrop'
import { verifQuestionMetaInteractif2d } from '../../../src/lib/interactif/gestionInteractif'
import { verifQuestionMathLive } from '../../../src/lib/interactif/mathLive'
import { verifQuestionQcm } from '../../../src/lib/interactif/qcm'
import { verifQuestionListeDeroulante } from '../../../src/lib/interactif/questionListeDeroulante'
import { verifQuestionSvgSelection } from '../../../src/lib/interactif/questionSvgSelection/questionSvgSelection'
import { verifQuestionTableur } from '../../../src/lib/tableur/outilsTableur'
import type { AutoCorrection, IExercice } from '../../../src/lib/types'
import {
  injectCliqueFigureDOM,
  injectCustomMathPromptDOM,
  injectDndDOM,
  injectFillInTheBlankDOM,
  injectInteractiveClockDOM,
  injectListeDeroulanteDOM,
  injectMathLiveDOM,
  injectMetaInteractif2dDOM,
  injectQcmDOM,
  injectSvgSelectionDOM,
  injectTableauMathliveDOM,
  injectTableurDOM,
} from './domSimulator'
import {
  ensureDragAndDropQuestion,
  extractClockValuesForCustom,
  extractPromptValuesForCustom,
  grandeurStringToLatex,
  normalizeCustomCorrectionResult,
  toCompareInput,
  toDndValeur,
  type VerificationResult,
} from './verifier-shared'

type CliqueFigureItem = { id: string; solution: boolean }

function isCliqueFigureItem(value: unknown): value is CliqueFigureItem {
  if (typeof value !== 'object' || value == null) return false
  const candidate: Partial<CliqueFigureItem> = value
  return (
    typeof candidate.id === 'string' && typeof candidate.solution === 'boolean'
  )
}

function verifyCustomQuestion(
  exercice: IExercice,
  questionIndex: number,
  ac: AutoCorrection | undefined,
): VerificationResult {
  if (typeof exercice.correctionInteractive !== 'function') {
    return {
      questionIndex,
      format: 'custom',
      isOk: true,
      feedback: '',
      skipped: true,
      skipReason: 'custom-no-correction-interactive',
    }
  }

  const exIdx = exercice.numeroExercice ?? 0
  const promptValues = extractPromptValuesForCustom(ac)
  if (Object.keys(promptValues).length > 0) {
    injectCustomMathPromptDOM(exIdx, questionIndex, promptValues)
    const inputId = `champTexteEx${exIdx}Q${questionIndex}`
    const expectedSelector = `math-field#${inputId}`
    const originalQuerySelector = document.querySelector.bind(document)
    document.querySelector = (selectors: string) => {
      if (selectors === expectedSelector) {
        return document.getElementById(inputId)
      }
      return originalQuerySelector(selectors)
    }
    let result: string | string[]
    try {
      result = exercice.correctionInteractive(questionIndex)
    } finally {
      document.querySelector = originalQuerySelector
    }
    const isOk = normalizeCustomCorrectionResult(result)
    return {
      questionIndex,
      format: 'custom',
      isOk,
      feedback: isOk ? '' : 'custom correctionInteractive returned KO',
      skipped: false,
    }
  }

  const clockValues = extractClockValuesForCustom(ac)
  const questionText = exercice.listeQuestions[questionIndex] ?? ''
  if (clockValues != null && questionText.includes('clockEx')) {
    injectInteractiveClockDOM(
      exIdx,
      questionIndex,
      clockValues.hour,
      clockValues.minute,
    )
    const result = exercice.correctionInteractive(questionIndex)
    const isOk = normalizeCustomCorrectionResult(result)
    return {
      questionIndex,
      format: 'custom',
      isOk,
      feedback: isOk ? '' : 'custom correctionInteractive returned KO',
      skipped: false,
    }
  }

  return {
    questionIndex,
    format: 'custom',
    isOk: true,
    feedback: '',
    skipped: true,
    skipReason: 'custom-no-adapter',
  }
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
          const answerStr = toCompareInput(rawAnswer, options)
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
          results.push(verifyCustomQuestion(exercice, i, ac))
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
