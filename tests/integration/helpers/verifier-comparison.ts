import { isAnswerType, type IExercice } from '../../../src/lib/types'
import { toCompareInput, type VerificationResult } from './verifier-shared'

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

    if (
      ![
        'mathlive',
        'texte',
        'fillInTheBlank',
        'tableauMathlive',
        'MetaInteractif2d',
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

    let allOk = true
    let failedField = ''
    let comparisonsExecuted = 0
    for (const [key, answer] of Object.entries(valeur)) {
      if (
        key === 'bareme' ||
        key === 'feedback' ||
        typeof answer === 'function'
      ) {
        continue
      }
      if (!isAnswerType(answer) || typeof answer.compare !== 'function')
        continue

      const value = Array.isArray(answer.value)
        ? String(answer.value[0])
        : String(answer.value)
      const options = answer.options ?? {}
      const compareValue = toCompareInput(value, options)
      try {
        const result = answer.compare(compareValue, value, options)
        comparisonsExecuted += 1
        if (!result.isOk) {
          allOk = false
          failedField = key
        }
      } catch (e) {
        comparisonsExecuted += 1
        allOk = false
        failedField = `${key}(threw: ${e instanceof Error ? e.message : e})`
      }
    }

    if (comparisonsExecuted === 0) {
      results.push({
        questionIndex: i,
        format,
        isOk: false,
        feedback: 'No compare function executed',
        skipped: true,
        skipReason: 'no-compare-function',
      })
      continue
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
