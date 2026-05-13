import { compile } from '@cortex-js/compute-engine'
import type { Check, CheckOverrides } from './types'
import {
  insertImplicitProducts,
  normalizeLatexArithmetic,
} from './latexArithmetic'

type Equation = {
  left: string
  right: string
}

type EvaluationPoint = Record<string, number>

const TOLERANCE = 1e-8
const VARIABLE_NAMES = 'abcdefghijklmnopqrstuvwxyz'.split('')

function splitEquation(value: string): Equation | undefined {
  const parts = value.split('=')
  if (parts.length !== 2) return undefined
  return {
    left: normalizeExpression(parts[0]),
    right: normalizeExpression(parts[1]),
  }
}

function normalizeExpression(value: string): string {
  return insertImplicitProducts(normalizeLatexArithmetic(value))
}

function variablesInExpression(expression: string): string[] {
  const withoutCommands = expression.replace(/\\[a-z]+/gi, '')
  const variables = new Set<string>()
  for (const variable of withoutCommands.match(/[a-z]/gi) ?? []) {
    variables.add(variable)
  }
  return [...variables].sort()
}

function variablesInEquations(equations: Equation[]): string[] {
  return [
    ...new Set(
      equations.flatMap((equation) => [
        ...variablesInExpression(equation.left),
        ...variablesInExpression(equation.right),
      ]),
    ),
  ].sort()
}

function valueAt(expression: string, point: EvaluationPoint): number | undefined {
  const compiled = compile(expression)
  if (compiled == null || compiled.run == null) return undefined
  let value: unknown
  try {
    value = compiled.run(point)
  } catch {
    value = runCompiledCode(compiled.code, point)
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function runCompiledCode(
  code: string | undefined,
  point: EvaluationPoint,
): unknown {
  if (code == null || code === '') return undefined

  const variableNames = Object.keys(point).sort()
  const variableValues = variableNames.map((variable) => point[variable])
  return Function(
    '_',
    ...variableNames,
    `"use strict"; return (${code});`,
  )(point, ...variableValues)
}

function equationDifferenceAt(
  equation: Equation,
  point: EvaluationPoint,
): number | undefined {
  const left = valueAt(equation.left, point)
  const right = valueAt(equation.right, point)
  if (left === undefined || right === undefined) return undefined
  return left - right
}

function evaluationPoints(variables: string[]): EvaluationPoint[] {
  if (variables.length === 0) return [{}]

  const points: EvaluationPoint[] = []
  for (let index = 0; index < Math.max(8, variables.length * 3); index++) {
    const point: EvaluationPoint = {}
    variables.forEach((variable, variableIndex) => {
      point[variable] = ((index + 2 * variableIndex) % 5) - 2
    })
    points.push(point)
  }
  return points
}

function isZeroExpression(expression: string): boolean {
  const normalized = normalizeExpression(expression)
  return evaluationPoints(variablesInExpression(normalized)).every((point) => {
    const value = valueAt(normalized, point)
    return value !== undefined && Math.abs(value) <= TOLERANCE
  })
}

function areEquivalentEquations(input: Equation, answer: Equation): boolean {
  const points = evaluationPoints(variablesInEquations([input, answer]))
  let ratio: number | undefined

  for (const point of points) {
    const inputValue = equationDifferenceAt(input, point)
    const answerValue = equationDifferenceAt(answer, point)
    if (inputValue === undefined || answerValue === undefined) return false

    if (Math.abs(answerValue) <= TOLERANCE) {
      if (Math.abs(inputValue) > TOLERANCE) return false
      continue
    }

    const currentRatio = inputValue / answerValue
    if (ratio === undefined) {
      ratio = currentRatio
    } else if (Math.abs(currentRatio - ratio) > TOLERANCE) {
      return false
    }
  }

  return ratio !== undefined
}

export function isEquation(options: CheckOverrides = {}): Check {
  return {
    name: options.name ?? 'isEquation',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    run: (saisie) => {
      const passed = splitEquation(saisie) !== undefined

      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          "La réponse doit être une équation avec un seul signe =.",
        feedbackOk: options.feedbackOk ?? 'La réponse est bien une équation.',
      }
    },
  }
}

export function isEquivalentEquation(options: CheckOverrides = {}): Check {
  return {
    name: options.name ?? 'isEquivalentEquation',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    run: (saisie, answer) => {
      const inputEquation = splitEquation(saisie)
      const answerEquation = splitEquation(answer)
      const passed =
        inputEquation !== undefined &&
        answerEquation !== undefined &&
        areEquivalentEquations(inputEquation, answerEquation)

      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          "L'équation saisie n'est pas équivalente à l'équation attendue.",
        feedbackOk:
          options.feedbackOk ??
          "L'équation saisie est équivalente à l'équation attendue.",
      }
    },
  }
}

export function hasZeroMember(options: CheckOverrides = {}): Check {
  return {
    name: options.name ?? 'hasZeroMember',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    run: (saisie) => {
      const equation = splitEquation(saisie)
      const passed =
        equation !== undefined &&
        (isZeroExpression(equation.left) || isZeroExpression(equation.right))

      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          "L'équation doit être écrite avec un membre égal à 0.",
        feedbackOk:
          options.feedbackOk ??
          "L'équation est bien écrite avec un membre égal à 0.",
      }
    },
  }
}
