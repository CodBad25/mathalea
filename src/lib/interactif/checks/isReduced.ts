import { all } from './combinators'
import {
  distributed,
  noNumericComputation,
  noTrivialFactor,
  termsGrouped,
} from './reductionAtoms'
import type { Check, CheckOverrides } from './types'

export function isReduced(options: CheckOverrides = {}): Check {
  const compare = all([
    noTrivialFactor(),
    noNumericComputation(),
    termsGrouped(),
    distributed(),
  ])

  return {
    name: options.name ?? 'isReduced',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    feedbackOnSuccess: options.feedbackOnSuccess,
    run: (saisie) => {
      const result = compare(saisie, saisie)
      return {
        passed: result.isOk,
        feedbackKo:
          options.feedbackKo ??
          result.feedback ??
          "Cette expression n'est pas assez réduite.",
        feedbackOk: options.feedbackOk,
      }
    },
  }
}
