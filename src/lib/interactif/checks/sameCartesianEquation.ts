import { compile } from '@cortex-js/compute-engine'
import type { Check, CheckOverrides } from './types'

type CartesianCoefficients = {
  a: number
  b: number
  c: number
}

const TOLERANCE = 1e-8

function normalizeExpression(value: string): string {
  return value
    .trim()
    .replaceAll('−', '-')
    .replaceAll('\\left', '')
    .replaceAll('\\right', '')
    .replaceAll('\\times', '*')
    .replaceAll('\\cdot', '*')
    .replace(/\\[dtc]?frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\s+/g, '')
    .replace(/(\d|\))(?=[xy(])/g, '$1*')
    .replace(/([xy])(?=\d|\()/g, '$1*')
    .replace(/\)(?=\d|[xy])/g, ')*')
}

function valueAt(expression: string, x: number, y: number): number | undefined {
  const compiled = compile(expression)
  if (compiled == null || compiled.run == null) return undefined
  const value = compiled.run({ x, y })
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isZeroExpression(expression: string): boolean {
  const normalized = normalizeExpression(expression)
  const controlPoints = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]
  return controlPoints.every(([x, y]) => {
    const value = valueAt(normalized, x, y)
    return value !== undefined && Math.abs(value) <= TOLERANCE
  })
}

function coefficientsFromEquation(
  equation: string,
): CartesianCoefficients | undefined {
  const parts = equation.split('=')
  if (parts.length !== 2) return undefined
  if (!isZeroExpression(parts[1])) return undefined

  const expression = normalizeExpression(parts[0])
  const c = valueAt(expression, 0, 0)
  const x1 = valueAt(expression, 1, 0)
  const y1 = valueAt(expression, 0, 1)
  if (c === undefined || x1 === undefined || y1 === undefined) return undefined

  const a = x1 - c
  const b = y1 - c
  if (Math.abs(a) <= TOLERANCE && Math.abs(b) <= TOLERANCE) return undefined

  const controlPoints = [
    [2, 0],
    [0, 2],
    [1, 1],
    [-1, 2],
  ]
  for (const [x, y] of controlPoints) {
    const value = valueAt(expression, x, y)
    if (value === undefined) return undefined
    if (Math.abs(value - (a * x + b * y + c)) > TOLERANCE) return undefined
  }

  return { a, b, c }
}

function sameLine(
  left: CartesianCoefficients,
  right: CartesianCoefficients,
): boolean {
  const scale =
    Math.max(
      1,
      Math.abs(left.a),
      Math.abs(left.b),
      Math.abs(left.c),
      Math.abs(right.a),
      Math.abs(right.b),
      Math.abs(right.c),
    ) ** 2

  return (
    Math.abs(left.a * right.b - left.b * right.a) <= TOLERANCE * scale &&
    Math.abs(left.a * right.c - left.c * right.a) <= TOLERANCE * scale &&
    Math.abs(left.b * right.c - left.c * right.b) <= TOLERANCE * scale
  )
}

export function sameCartesianEquation(options: CheckOverrides = {}): Check {
  return {
    name: options.name ?? 'sameCartesianEquation',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    run: (saisie, answer) => {
      const inputCoefficients = coefficientsFromEquation(saisie)
      const answerCoefficients = coefficientsFromEquation(answer)
      const passed =
        inputCoefficients !== undefined &&
        answerCoefficients !== undefined &&
        sameLine(inputCoefficients, answerCoefficients)

      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          "L'équation saisie ne décrit pas la droite attendue.",
        feedbackOk: options.feedbackOk,
      }
    },
  }
}
