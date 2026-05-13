import { ComputeEngine } from '@cortex-js/compute-engine'
import type { Check, CheckOverrides } from './types'
import { normalizeLatexArithmetic } from './latexArithmetic'

const ce = new ComputeEngine()
const TOLERANCE = 1e-7

export interface ParametricZeroSetProgression {
  offset: number
  period: number
}

function cleanLatex(input: string): string {
  return normalizeLatexArithmetic(input)
    .replaceAll('π', '\\pi')
    .replaceAll('ℤ', '\\mathbb{Z}')
    .replaceAll('\\left', '')
    .replaceAll('\\right', '')
    .replaceAll('\\,', '')
    .replace(/^\$/, '')
    .replace(/\$$/, '')
}

function extractExpression(input: string): string {
  let expression = cleanLatex(input).replace(/^S=/, '')
  const midIndex = expression.search(/\\mid|\|/)

  if (midIndex >= 0) {
    const firstEscapedBrace = expression.indexOf('\\{')
    const firstBrace = expression.indexOf('{')
    const braceIndex =
      firstEscapedBrace >= 0
        ? firstEscapedBrace + 2
        : firstBrace >= 0
          ? firstBrace + 1
          : 0

    expression = expression.slice(braceIndex, midIndex)
  }

  return expression.replace(/^x=/, '')
}

function evaluateForK(expression: string, k: number): number | null {
  try {
    const value = ce.parse(expression).subs({ k }).N().re
    return value == null || !Number.isFinite(value) ? null : value
  } catch {
    return null
  }
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < TOLERANCE
}

function nearlyInteger(value: number): boolean {
  return nearlyEqual(value, Math.round(value))
}

function compareParametricZeroSet(
  input: string,
  expected: ParametricZeroSetProgression,
): { isOk: boolean; feedback?: string } {
  const expression = extractExpression(input)
  const values = [0, 1, 2, 3].map((k) => evaluateForK(expression, k))

  if (values.some((value) => value == null)) {
    return {
      isOk: false,
      feedback:
        "La réponse doit contenir une expression dépendant de l'entier $k$.",
    }
  }

  const [v0, v1, v2, v3] = values as number[]
  const step = v1 - v0

  if (
    nearlyEqual(step, 0) ||
    !nearlyEqual(v2 - v1, step) ||
    !nearlyEqual(v3 - v2, step)
  ) {
    return {
      isOk: false,
      feedback:
        "L'expression doit définir une suite arithmétique de solutions indexée par $k$.",
    }
  }

  if (!nearlyEqual(Math.abs(step), expected.period)) {
    return {
      isOk: false,
      feedback: 'Le pas entre deux zéros consécutifs est incorrect.',
    }
  }

  if (!nearlyInteger((v0 - expected.offset) / expected.period)) {
    return {
      isOk: false,
      feedback: 'Le premier terme proposé ne décrit pas le bon ensemble.',
    }
  }

  return { isOk: true }
}

export function sameParametricZeroSet(
  expected: ParametricZeroSetProgression,
  options: CheckOverrides = {},
): Check {
  return {
    name: options.name ?? 'sameParametricZeroSet',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    feedbackOnSuccess: options.feedbackOnSuccess,
    run: (saisie) => {
      const result = compareParametricZeroSet(saisie, expected)
      return {
        passed: result.isOk,
        feedbackKo:
          options.feedbackKo ??
          result.feedback ??
          "L'ensemble de zéros saisi ne correspond pas à l'ensemble attendu.",
        feedbackOk: options.feedbackOk,
      }
    },
  }
}
