import FractionEtendue from '../../modules/FractionEtendue'
import { generateCleaner } from '../interactif/cleaners'
import { Complexe } from '../mathFonctions/Complexe'
import { isValeur, type IExercice } from '../types'
import { countDecimals, countDigits, isFractionValue } from './amcHelpers'
import type { IExerciceAMC, ReponseParams } from './amcTypes'

const mathliveNumericCleaner = generateCleaner(['latex', 'virgules', 'espaces'])
const strictNumericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
const compactPowerPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\^[+-]?\d+$/

export function extractAMCValue(
  reponse: unknown,
): number | { num: number; den: number } | string | undefined {
  const unwrap = (value: unknown): unknown => {
    if (Array.isArray(value)) return unwrap(value[0])

    if (isValeur(value) && 'reponse' in value)
      return unwrap(value.reponse?.value)

    if (typeof value === 'object' && value !== null) {
      if ('reponse' in value) {
        return unwrap(
          (value as { reponse?: { value?: unknown } }).reponse?.value,
        )
      }
      if ('valeur' in value) {
        return unwrap((value as { valeur?: unknown }).valeur)
      }
      if ('value' in value) {
        return unwrap((value as { value?: unknown }).value)
      }
    }

    return value
  }

  const value = unwrap(reponse)
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (value instanceof FractionEtendue) {
    return { num: value.num, den: value.den }
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'num' in value &&
    'den' in value
  ) {
    return { num: Number(value.num), den: Number(value.den) }
  }
  window.notify(
    'extractAMCValue a reçu une réponse de type inattendu, elle doit être une chaîne de caractères, un nombre ou un objet fractionnaire.',
    { reponse: JSON.stringify(reponse) },
  )
  return undefined
}

export function inferNumericValueForAMC(
  value: number | { num: number; den: number } | string | undefined,
): number | { num: number; den: number } | undefined {
  if (Array.isArray(value)) {
    value = value[0]
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    Number.isFinite(value.num) &&
    Number.isFinite(value.den) &&
    value.den !== 0
  ) {
    return value
  }
  // Gérer le cas Decimal
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).toNumber === 'function'
  ) {
    const decimalValue = (value as any).toNumber()
    return Number.isFinite(decimalValue) ? decimalValue : undefined
  }

  if (value instanceof Complexe) {
    if (value.isReal) return value.re
    return undefined
  }
  if (typeof value !== 'string') {
    window.notify(
      'inferNumericValueForAMC a reçu une valeur de type inattendu, elle doit être une chaîne de caractères, un nombre ou un objet fractionnaire.',
      { value: JSON.stringify(value) },
    )
    return undefined
  }

  // à partir d'ici, on considère que value est une chaine de caractères
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined

  // On teste le cas fractionnaire
  if (isFractionValue(trimmed)) {
    const match = trimmed.match(
      /^\s*([+-]?)\s*\\(?:d?frac)\s*{([^}]*)}\s*{([^}]*)}\s*$/,
    )
    if (match == null) return undefined

    const sign = match[1]
    const numerator = Number.parseFloat(`${sign}${match[2]}`)
    const denominator = Number.parseFloat(match[3])

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return undefined
    }
    if (denominator === 0) return undefined

    return {
      num: numerator,
      den: denominator,
    }
  }

  // Pour l'instant on n'infère que les valeurs numériques décimales.
  if (/^\\?sqrt/.test(trimmed)) return undefined

  const cleaned = mathliveNumericCleaner(trimmed)
  if (strictNumericPattern.test(cleaned)) {
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (compactPowerPattern.test(cleaned)) {
    const base = cleaned.split('^', 1)[0]
    const parsed = Number(base)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export function mergeNumericParamsFromOptions(
  baseParam: ReponseParams | undefined,
  options: ReponseParams | undefined,
): ReponseParams {
  const merged: ReponseParams = { ...(baseParam ?? {}) }
  if (options == null) return merged

  const supportedOptionKeys: Array<keyof ReponseParams> = [
    'digits',
    'decimals',
    'signe',
    'exposantNbChiffres',
    'exposantSigne',
    'approx',
    'vertical',
    'strict',
    'scoreapprox',
    'tpoint',
  ]

  for (const key of supportedOptionKeys) {
    const optionValue = options[key]
    if (optionValue !== undefined && merged[key] === undefined) {
      ;(merged as Record<string, unknown>)[key] = optionValue
    }
  }

  return merged
}

type InteractiveAnswerCandidate = {
  value: unknown
}

function extractInteractiveAnswerCandidate(
  source: unknown,
): InteractiveAnswerCandidate | undefined {
  if (typeof source !== 'object' || source == null) {
    window.notify(
      'extractInteractiveAnswerCandidate a reçu une source de type inattendu, elle doit être un objet contenant une propriété "value" ou "reponse".',
      { source: JSON.stringify(source) },
    )
    return undefined
  }

  const record = source as Record<string, unknown>

  if ('value' in record) {
    return {
      value: record.value,
    }
  }

  if ('reponse' in record) {
    return extractInteractiveAnswerCandidate(record.reponse)
  }

  if ('champ1' in record && !('champ2' in record)) {
    return extractInteractiveAnswerCandidate(record.champ1)
  }

  if ('field1' in record && !('field2' in record)) {
    return extractInteractiveAnswerCandidate(record.field1)
  }

  if ('valeur' in record) {
    return extractInteractiveAnswerCandidate(record.valeur)
  }

  return undefined
}

/**
 * Infère des options AMCNum à partir d'une réponse interactive de type
 * `{ reponse: { value, options, compare } }`.
 *
 * Cette fonction ne remplace pas des options AMC explicites (`reponse.param`),
 * elle produit seulement une base à fusionner ensuite à partir de `value`.
 * Les options de comparaison interactive (`options`, `compare`) ne servent
 * pas à inférer les paramètres AMC.
 */
export function inferAmcOptionsFromAnswerType(
  source: unknown,
): ReponseParams | undefined {
  const candidate = extractInteractiveAnswerCandidate(source)
  if (candidate == null) return undefined

  const answerValues = Array.isArray(candidate.value)
    ? candidate.value
    : [candidate.value]

  let hasNumericCandidate = false
  let inferredDigits = 0
  let inferredDecimals = 0
  let inferredSign = false

  for (const answerValue of answerValues) {
    const numericValue = inferNumericValueForAMC(extractAMCValue(answerValue))
    if (numericValue === undefined) continue

    hasNumericCandidate = true

    if (typeof numericValue === 'number') {
      const decimals = countDecimals(numericValue)
      const digits = countDigits(numericValue) + decimals
      inferredDigits = Math.max(inferredDigits, digits)
      inferredDecimals = Math.max(inferredDecimals, decimals)
      inferredSign ||= numericValue < 0
      continue
    }

    const digitsNum = countDigits(numericValue.num)
    const digitsDen = countDigits(numericValue.den)
    inferredDigits = Math.max(inferredDigits, digitsNum + digitsDen)
    inferredDecimals = Math.max(inferredDecimals, digitsDen)
    inferredSign ||= numericValue.num * numericValue.den < 0
  }

  if (!hasNumericCandidate) return undefined

  const inferred: ReponseParams = {
    digits: inferredDigits,
    decimals: inferredDecimals,
    signe: inferredSign,
  }

  return inferred
}

export function extractInteractifOptions(
  reponse: unknown,
): { [key: string]: unknown } | undefined {
  if (typeof reponse === 'object' && reponse !== null) {
    if ('reponse' in reponse) {
      return extractInteractifOptions(
        (reponse as { reponse?: { value?: unknown; param?: unknown } }).reponse,
      )
    }
    if ('options' in reponse) {
      return (reponse as { options?: { [key: string]: unknown } }).options
    }
  }
  return undefined
}

export function ensureAMCOpenAutoCorrection(
  exercice: IExercice | IExerciceAMC,
  targetAutoCorrection?: Array<any>,
) {
  const autoCorrection = targetAutoCorrection ?? exercice.autoCorrection

  const questionCount = Math.max(
    autoCorrection.length,
    exercice.listeQuestions.length,
    exercice.listeCorrections.length,
    exercice.question != null ? 1 : 0,
    1,
  )

  for (let i = 0; i < questionCount; i++) {
    const existing = autoCorrection[i] as
      | {
          enonce?: string
          propositions?: Array<{
            texte?: string
            statut?: number
            sanscadre?: boolean
            pointilles?: boolean
          }>
        }
      | undefined

    const enonce =
      existing?.enonce ??
      exercice.listeQuestions[i] ??
      (i === 0 ? (exercice.question ?? '') : '')
    const correction =
      exercice.listeCorrections[i] ??
      (i === 0 ? (exercice.correction ?? '') : '')

    if (existing == null) {
      autoCorrection[i] = {
        enonce,
        propositions: [
          {
            texte: correction,
            statut: 3,
            sanscadre: false,
            pointilles: true,
          },
        ],
      }
      continue
    }

    if (existing.enonce == null) existing.enonce = enonce
    if ((existing.propositions?.length ?? 0) === 0) {
      existing.propositions = [
        {
          texte: correction,
          statut: 3,
          sanscadre: false,
          pointilles: true,
        },
      ]
    }
  }
}
