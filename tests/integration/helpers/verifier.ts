import { verifQuestionMathLive } from '../../../src/lib/interactif/mathLive'
import { verifQuestionQcm } from '../../../src/lib/interactif/qcm'
import { verifQuestionListeDeroulante } from '../../../src/lib/interactif/questionListeDeroulante'
import type { IExercice } from '../../../src/lib/types'
import {
  injectFillInTheBlankDOM,
  injectListeDeroulanteDOM,
  injectMathLiveDOM,
  injectQcmDOM,
  injectTableauMathliveDOM,
} from './domSimulator'

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
          const answerStr = Array.isArray(answer)
            ? String(answer[0])
            : String(answer)
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
              champValues[key] = Array.isArray(val)
                ? String(val[0])
                : String(val)
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
              cellValues[key] = Array.isArray(val)
                ? String(val[0])
                : String(val)
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

        // Formats that require real browser interaction — skip
        case 'cliqueFigure':
        case 'dnd':
        case 'svgSelection':
        case 'tableur':
        case 'MetaInteractif2d':
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
        undefined,
      ].includes(format)
    ) {
      results.push({
        questionIndex: i,
        format,
        isOk: true,
        feedback: '',
        skipped: true,
        skipReason: `format-${format}`,
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
      try {
        const result = answer.compare(value, value, options)
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
