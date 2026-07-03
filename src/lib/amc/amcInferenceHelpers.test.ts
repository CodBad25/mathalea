import { describe, expect, it } from 'vitest'

import { fonctionComparaison } from '../interactif/comparisonFunctions'
import {
  inferAmcOptionsFromAnswerType,
  mergeNumericParamsFromOptions,
} from './amcInferenceHelpers'

describe('amcInferenceHelpers', () => {
  it('couvre les formes de {reponse: {value, compare, options}} et l inference associee', () => {
    const compare = fonctionComparaison

    const cases: Array<{
      label: string
      input: unknown
      expected:
        | {
            digits: number
            decimals: number
            signe: boolean
          }
        | undefined
    }> = [
      {
        label: 'value numerique simple',
        input: { reponse: { value: 5 } },
        expected: { digits: 1, decimals: 0, signe: false },
      },
      {
        label: 'value numerique simple négative',
        input: { reponse: { value: -5 } },
        expected: { digits: 1, decimals: 0, signe: true },
      },
      {
        label: 'value numerique decimal string',
        input: { reponse: { value: '1,5' } },
        expected: { digits: 2, decimals: 1, signe: false },
      },
      {
        label: 'value numerique simple forme exponentielle',
        input: { reponse: { value: '2^8', options: { puissance: true } } },
        expected: { digits: 1, decimals: 0, signe: false },
      },
      {
        label: 'value fraction latex',
        input: { reponse: { value: '\\dfrac{-12}{5}' } },
        expected: { digits: 3, decimals: 1, signe: true },
      },
      {
        label: 'value tableau de valeurs numeriques',
        input: { reponse: { value: ['-\\dfrac{5}{2}', '-2.5'] } },
        expected: { digits: 2, decimals: 1, signe: true },
      },
      {
        label: 'value tableau combine fraction et decimal',
        input: {
          reponse: {
            value: ['\\frac{1}{2}', '0.5'],
            options: { fractionEgale: true },
          },
        },
        expected: { digits: 2, decimals: 1, signe: false },
      },
      {
        label: 'options interactives ignorees pour AMC',
        input: {
          reponse: {
            value: 2,
            compare,
            options: {
              noFeedback: true,
              expressionNumerique: true,
            },
          },
        },
        expected: {
          digits: 1,
          decimals: 0,
          signe: false,
        },
      },
      {
        label: 'forme answerType directe',
        input: { value: 9, compare, options: { strict: false } },
        expected: { digits: 1, decimals: 0, signe: false },
      },
      {
        label: 'forme imbriquee via valeur',
        input: { valeur: { reponse: { value: 3.75, compare } } },
        expected: { digits: 3, decimals: 2, signe: false },
      },
      {
        label: 'forme non numerique',
        input: { reponse: { value: ['x+1', '\\sqrt{2}'], compare } },
        expected: undefined,
      },
      {
        label: 'expression arithmetique non numerique',
        input: { reponse: { value: '7 + 8', compare } },
        expected: undefined,
      },
    ]

    for (const testCase of cases) {
      expect(
        inferAmcOptionsFromAnswerType(testCase.input),
        testCase.label,
      ).toEqual(testCase.expected)
    }
  })

  it('infere des options AMCNum depuis une reponse interactive decimal/array', () => {
    const inferred = inferAmcOptionsFromAnswerType({
      reponse: {
        value: [12.3, -4],
        options: { strict: true },
      },
    })

    expect(inferred).toEqual({
      digits: 3,
      decimals: 1,
      signe: true,
    })
  })

  it('infere des options AMCNum depuis une fraction latex', () => {
    const inferred = inferAmcOptionsFromAnswerType({
      reponse: {
        value: '\\frac{-12}{5}',
      },
    })

    expect(inferred).toEqual({
      digits: 3,
      decimals: 1,
      signe: true,
    })
  })

  it('retourne undefined quand la valeur n est pas numerique', () => {
    const inferred = inferAmcOptionsFromAnswerType({
      reponse: {
        value: 'x+1',
      },
    })

    expect(inferred).toBeUndefined()
  })

  it('preserve la priorite des options AMC explicites', () => {
    const merged = mergeNumericParamsFromOptions(
      { digits: 2, decimals: 0, signe: false },
      { digits: 5, decimals: 2, signe: true, strict: true },
    )

    expect(merged).toEqual({
      digits: 2,
      decimals: 0,
      signe: false,
      strict: true,
    })
  })
})
