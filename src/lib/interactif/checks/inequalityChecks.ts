import { compile } from '@cortex-js/compute-engine'
import {
  insertImplicitProducts,
  normalizeLatexArithmetic,
} from './latexArithmetic'
import type { Check, CheckOverrides } from './types'

type Relation = '<' | '<=' | '>' | '>='
type Inequality = { left: string; relation: Relation; right: string }

const tolerance = 1e-8

function normalizeRelation(value: string): string {
  return value
    .replaceAll('\\leqslant', '<=')
    .replaceAll('\\geqslant', '>=')
    .replaceAll('\\leq', '<=')
    .replaceAll('\\geq', '>=')
    .replaceAll('\\le', '<=')
    .replaceAll('\\ge', '>=')
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
}

export function splitInequality(value: string): Inequality | undefined {
  const normalized = normalizeRelation(value)
  const matches = [...normalized.matchAll(/<=|>=|<|>/g)]
  if (matches.length !== 1 || matches[0].index == null) return undefined
  const relation = matches[0][0] as Relation
  const index = matches[0].index
  const left = normalized.slice(0, index).trim()
  const right = normalized.slice(index + relation.length).trim()
  if (left === '' || right === '') return undefined
  return { left, relation, right }
}

function normalizedExpression(value: string): string {
  return insertImplicitProducts(normalizeLatexArithmetic(value))
}

function variablesIn(value: string): string[] {
  return [...new Set(value.replace(/\\[a-z]+/gi, '').match(/[a-z]/gi) ?? [])]
}

function evaluate(value: string, point: Record<string, number>): number | null {
  const compiled = compile(normalizedExpression(value))
  if (compiled?.run == null) return null
  try {
    const result = compiled.run(point)
    return typeof result === 'number' && Number.isFinite(result) ? result : null
  } catch {
    return null
  }
}

function differenceAt(
  inequality: Inequality,
  point: Record<string, number>,
): number | null {
  const left = evaluate(inequality.left, point)
  const right = evaluate(inequality.right, point)
  return left == null || right == null ? null : left - right
}

function reverse(relation: Relation): Relation {
  return ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as const)[relation]
}

function areEquivalent(input: Inequality, answer: Inequality): boolean {
  const variables = [
    ...new Set([
      ...variablesIn(input.left),
      ...variablesIn(input.right),
      ...variablesIn(answer.left),
      ...variablesIn(answer.right),
    ]),
  ].sort()
  const points = Array.from(
    { length: Math.max(8, variables.length * 3) },
    (_, i) =>
      Object.fromEntries(
        variables.map((variable, j) => [variable, ((i + 2 * j) % 7) - 3]),
      ),
  )
  let ratio: number | undefined
  for (const point of points) {
    const inputValue = differenceAt(input, point)
    const answerValue = differenceAt(answer, point)
    if (inputValue == null || answerValue == null) return false
    if (Math.abs(answerValue) <= tolerance) {
      if (Math.abs(inputValue) > tolerance) return false
      continue
    }
    const currentRatio = inputValue / answerValue
    if (Math.abs(currentRatio) <= tolerance) return false
    if (ratio == null) ratio = currentRatio
    else if (Math.abs(currentRatio - ratio) > tolerance) return false
  }
  if (ratio == null) return false
  const expectedRelation =
    ratio < 0 ? reverse(answer.relation) : answer.relation
  return input.relation === expectedRelation
}

export function isEquivalentInequality(options: CheckOverrides = {}): Check {
  return {
    name: options.name ?? 'isEquivalentInequality',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    run: (input, answer) => {
      const parsedInput = splitInequality(input)
      const parsedAnswer = splitInequality(answer)
      const passed =
        parsedInput != null &&
        parsedAnswer != null &&
        areEquivalent(parsedInput, parsedAnswer)
      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          "L'inéquation saisie n'est pas équivalente à l'inéquation précédente.",
        feedbackOk:
          options.feedbackOk ??
          "L'inéquation saisie est équivalente à l'inéquation précédente.",
      }
    },
  }
}
