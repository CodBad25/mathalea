import type { Check, CheckOverrides } from './types'
import { evaluateArithmeticExpression } from './evaluateArithmeticExpression'
import { normalizeLatexArithmetic, splitTopLevelTerms } from './latexArithmetic'

type SameIntegerProgressionSetOptions = CheckOverrides & {
  variable?: string
  allowMultipleExpressions?: boolean
}

type Progression = {
  offset: number
  period: number
}

const TOLERANCE = 1e-7
const MAX_COMMON_PERIOD = 500

function cleanLatex(input: string): string {
  return input
    .trim()
    .replaceAll('π', '\\pi')
    .replaceAll('ℤ', '\\mathbb{Z}')
    .replaceAll('\\left', '')
    .replaceAll('\\right', '')
    .replaceAll('\\,', '')
    .replace(/^\$/, '')
    .replace(/\$$/, '')
    .replace(/\s+/g, '')
}

function extractExpressionList(input: string): string {
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
  } else {
    expression = expression
      .replace(/^\\\{/, '')
      .replace(/\\\}$/, '')
      .replace(/^\{/, '')
      .replace(/\}$/, '')
  }

  return expression.replace(/^x=/, '')
}

function splitTopLevelExpressions(input: string): string[] {
  const expressions: string[] = []
  let start = 0
  let depth = 0

  for (let index = 0; index < input.length; index++) {
    const character = input[index]
    const previous = input[index - 1] ?? ''
    const next = input[index + 1] ?? ''

    if (character === '{' || character === '(' || character === '[') depth++
    if (character === '}' || character === ')' || character === ']') depth--

    const isDecimalComma = /\d/.test(previous) && /\d/.test(next)
    if (
      depth === 0 &&
      (character === ';' || (character === ',' && !isDecimalComma))
    ) {
      expressions.push(input.slice(start, index))
      start = index + 1
    }
  }

  expressions.push(input.slice(start))
  return expressions
    .map((expression) => expression.replace(/^x=/, '').trim())
    .filter((expression) => expression !== '')
}

function normalizeExpression(value: string): string {
  return normalizeLatexArithmetic(value)
    .replaceAll('\\pi', 'PI')
    .replaceAll('π', 'PI')
    .replace(/pi/gi, 'PI')
}

function inferVariable(saisie: string, answer: string): string {
  const letters = `${normalizeExpression(saisie)}${normalizeExpression(answer)}`
    .replace(/PI/g, '')
    .match(/[A-Za-z]/g)
  const uniqueLetters = Array.from(new Set(letters ?? []))
  return uniqueLetters.length === 1 ? uniqueLetters[0] : 'x'
}

function safeEvaluateNumber(expression: string): number | undefined {
  const withProducts = expression
    .replace(/(\d|\))(?=PI|\()/g, '$1*')
    .replace(/PI(?=\d|\()/g, 'PI*')
  if (!/^[\d.()+\-*/PI]+$/.test(withProducts)) return undefined
  return evaluateArithmeticExpression(withProducts)
}

function coefficientFromTerm(
  term: string,
  variable: string,
): number | undefined {
  const withoutVariable = term
    .replace(new RegExp(`\\*?${variable}\\*?`), '*')
    .replace(/^\+\*/, '+')
    .replace(/^-\*/, '-')
    .replace(/\*$/, '')
    .replace(/\*\*/g, '*')

  if (withoutVariable === '+' || withoutVariable === '') return 1
  if (withoutVariable === '-') return -1
  return safeEvaluateNumber(withoutVariable)
}

function progressionOf(
  value: string,
  variable: string,
): Progression | undefined {
  const expression = normalizeExpression(value)
  let step = 0
  let offset = 0

  for (const term of splitTopLevelTerms(expression)) {
    if (term.includes(variable)) {
      if ((term.match(new RegExp(variable, 'g')) ?? []).length > 1) {
        return undefined
      }
      const coefficient = coefficientFromTerm(term, variable)
      if (coefficient === undefined) return undefined
      step += coefficient
    } else {
      const constant = safeEvaluateNumber(term)
      if (constant === undefined) return undefined
      offset += constant
    }
  }

  if (nearlyEqual(step, 0)) return undefined
  return { offset, period: Math.abs(step) }
}

function progressionsOf(
  value: string,
  variable: string,
  allowMultipleExpressions: boolean,
): Progression[] | undefined {
  const expressionList = extractExpressionList(value)
  const expressions = allowMultipleExpressions
    ? splitTopLevelExpressions(expressionList)
    : [expressionList]

  if (expressions.length === 0) return undefined

  const progressions = expressions.map((expression) =>
    progressionOf(expression, variable),
  )
  if (progressions.some((progression) => progression === undefined)) {
    return undefined
  }

  return progressions as Progression[]
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE
}

function nearlyInteger(value: number): boolean {
  return nearlyEqual(value, Math.round(value))
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const remainder = x % y
    x = y
    y = remainder
  }
  return x
}

function lcm(values: number[]): number {
  return values.reduce(
    (multiple, value) => (multiple * value) / gcd(multiple, value),
    1,
  )
}

function positiveModulo(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo
}

function coveredResidues(
  progressions: Progression[],
  baseOffset: number,
  basePeriod: number,
  commonPeriod: number,
): Set<number> | undefined {
  const residues = new Set<number>()

  for (const progression of progressions) {
    const stepRatio = progression.period / basePeriod
    const offsetRatio = (progression.offset - baseOffset) / basePeriod

    if (!nearlyInteger(stepRatio) || !nearlyInteger(offsetRatio)) {
      return undefined
    }

    const step = Math.round(stepRatio)
    const start = positiveModulo(Math.round(offsetRatio), commonPeriod)

    if (step < 1) return undefined

    for (let residue = 0; residue < commonPeriod; residue++) {
      if (positiveModulo(residue - start, step) === 0) {
        residues.add(residue)
      }
    }
  }

  return residues
}

function sameProgressionSet(
  left: Progression[],
  right: Progression[],
): boolean {
  if (left.length === 0 || right.length === 0) return false

  const allProgressions = [...left, ...right]
  const basePeriod = Math.min(
    ...allProgressions.map((progression) => progression.period),
  )
  const baseOffset = allProgressions[0].offset
  const periodRatios = allProgressions.map(
    (progression) => progression.period / basePeriod,
  )

  if (periodRatios.some((ratio) => !nearlyInteger(ratio))) return false

  const commonPeriod = lcm(periodRatios.map(Math.round))
  if (commonPeriod > MAX_COMMON_PERIOD) return false

  const leftResidues = coveredResidues(
    left,
    baseOffset,
    basePeriod,
    commonPeriod,
  )
  const rightResidues = coveredResidues(
    right,
    baseOffset,
    basePeriod,
    commonPeriod,
  )

  if (leftResidues === undefined || rightResidues === undefined) return false
  if (leftResidues.size !== rightResidues.size) return false

  return [...leftResidues].every((residue) => rightResidues.has(residue))
}

export function sameIntegerProgressionSet(
  options: SameIntegerProgressionSetOptions = {},
): Check {
  return {
    name: options.name ?? 'sameIntegerProgressionSet',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    feedbackOnSuccess: options.feedbackOnSuccess,
    run: (saisie, answer) => {
      const variable = options.variable ?? inferVariable(saisie, answer)
      const allowMultipleExpressions = options.allowMultipleExpressions ?? false
      const inputProgressions = progressionsOf(
        saisie,
        variable,
        allowMultipleExpressions,
      )
      const answerProgressions = progressionsOf(
        answer,
        variable,
        allowMultipleExpressions,
      )

      return {
        passed:
          inputProgressions !== undefined &&
          answerProgressions !== undefined &&
          sameProgressionSet(inputProgressions, answerProgressions),
        feedbackKo:
          options.feedbackKo ??
          'Les expressions ne décrivent pas le même ensemble.',
        feedbackOk: options.feedbackOk,
      }
    },
  }
}
