import { ComputeEngine } from '@cortex-js/compute-engine'

const ce = new ComputeEngine()
const TOLERANCE = 1e-7

export interface ZeroSetProgression {
  offset: number
  period: number
}

function cleanLatex(input: string): string {
  return input
    .replaceAll('π', '\\pi')
    .replaceAll('ℤ', '\\mathbb{Z}')
    .replaceAll('\\dfrac', '\\frac')
    .replaceAll('\\left', '')
    .replaceAll('\\right', '')
    .replaceAll('\\,', '')
    .replace(/\s+/g, '')
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

export function compareZeroSetParametrique(
  input: string,
  expected: ZeroSetProgression,
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
