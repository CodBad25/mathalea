import type { Check, CheckOverrides } from './types'
import { evaluateArithmeticExpression } from './evaluateArithmeticExpression'

type SameDescribedSetOptions = CheckOverrides & {
  variable?: string
}

type Progression = {
  step: number
  offset: number
}

const TOLERANCE = 1e-9

function normalizeExpression(value: string): string {
  return value
    .trim()
    .replaceAll(',', '.')
    .replaceAll('−', '-')
    .replaceAll('\\times', '*')
    .replaceAll('\\cdot', '*')
    .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replaceAll('\\pi', 'PI')
    .replaceAll('π', 'PI')
    .replace(/\bpi\b/gi, 'PI')
    .replace(/\s+/g, '')
}

function inferVariable(saisie: string, answer: string): string {
  const letters = `${normalizeExpression(saisie)}${normalizeExpression(answer)}`
    .replace(/PI/g, '')
    .match(/[A-Za-z]/g)
  const uniqueLetters = Array.from(new Set(letters ?? []))
  return uniqueLetters.length === 1 ? uniqueLetters[0] : 'x'
}

function splitTerms(expression: string): string[] {
  const normalized = expression.startsWith('-') ? expression : `+${expression}`
  return normalized.match(/[+-][^+-]+/g) ?? []
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

  for (const term of splitTerms(expression)) {
    if (term.includes(variable)) {
      if ((term.match(new RegExp(variable, 'g')) ?? []).length > 1)
        return undefined
      const coefficient = coefficientFromTerm(term, variable)
      if (coefficient === undefined) return undefined
      step += coefficient
    } else {
      const constant = safeEvaluateNumber(term)
      if (constant === undefined) return undefined
      offset += constant
    }
  }

  return { step, offset }
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE
}

function sameProgression(left: Progression, right: Progression): boolean {
  if (nearlyEqual(left.step, 0) || nearlyEqual(right.step, 0)) {
    return (
      nearlyEqual(left.step, 0) &&
      nearlyEqual(right.step, 0) &&
      nearlyEqual(left.offset, right.offset)
    )
  }

  const step = Math.abs(left.step)
  if (!nearlyEqual(step, Math.abs(right.step))) return false

  const shift = (left.offset - right.offset) / step
  return nearlyEqual(shift, Math.round(shift))
}

export function sameDescribedSet(options: SameDescribedSetOptions = {}): Check {
  return {
    name: options.name ?? 'sameDescribedSet',
    weight: options.weight,
    feedbackEnabled: options.feedbackEnabled,
    feedbackOnSuccess: options.feedbackOnSuccess,
    run: (saisie, answer) => {
      const variable = options.variable ?? inferVariable(saisie, answer)
      const inputProgression = progressionOf(saisie, variable)
      const answerProgression = progressionOf(answer, variable)
      const passed =
        inputProgression !== undefined &&
        answerProgression !== undefined &&
        sameProgression(inputProgression, answerProgression)

      return {
        passed,
        feedbackKo:
          options.feedbackKo ??
          'Les deux expressions ne décrivent pas le même ensemble.',
        feedbackOk: options.feedbackOk,
      }
    },
  }
}
