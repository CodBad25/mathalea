import FractionEtendue from '../../modules/FractionEtendue'
import { generateCleaner } from '../interactif/cleaners'
import { isValeur, type IExercice, type ReponseParams } from '../types'
import { isFractionValue } from './amcHelpers'
import type { IExerciceAMC } from './amcTypes'

const mathliveNumericCleaner = generateCleaner(['latex', 'virgules', 'espaces'])

export function extractAMCValue(
  reponse: unknown,
): number | { num: number; den: number } | string | undefined {
  const unwrap = (value: unknown): unknown => {
    if (Array.isArray(value)) return unwrap(value[0])

    if (isValeur(value)) return unwrap(value.reponse?.value)

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
  return undefined
}

export function inferNumericValueForAMC(
  value: number | { num: number; den: number } | string | undefined,
): number | { num: number; den: number } | undefined {
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

  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
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
  const parsed = Number.parseFloat(cleaned.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

export function mergeNumericParamsFromOptions(
  baseParam: ReponseParams | undefined,
  options: { [key: string]: unknown } | undefined,
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
    const optionValue = options[key as string]
    if (optionValue !== undefined) {
      ;(merged as Record<string, unknown>)[key] = optionValue
    }
  }

  return merged
}

export function extractAMCOptions(
  reponse: unknown,
): { [key: string]: unknown } | undefined {
  if (typeof reponse === 'object' && reponse !== null) {
    if ('reponse' in reponse) {
      return extractAMCOptions(
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
