import FractionEtendue from '../../modules/FractionEtendue'
import { isValeur, type IExercice, type ValeurNormalized } from '../types'

/**
 * Applique une compatibilité AMC par défaut quand un exercice n'est pas paramétré finement.
 * Cette fonction privilégie un export possible (fallback AMCOpen) plutôt qu'un rejet.
 */
export function mathaleaEnsureAMCCompatibility(exercice: IExercice): IExercice {
  const cachedInteractiveAutoCorrection = Array.isArray(
    (exercice as any).interactiveAutoCorrectionForAMC,
  )
    ? ((exercice as any).interactiveAutoCorrectionForAMC as Array<{
        reponse?: { valeur?: unknown }
      }>)
    : []

  const extractAMCValue = (
    reponse: unknown,
  ): number | { num: number; den: number } | undefined => {
    const unwrap = (value: unknown): unknown => {
      if (Array.isArray(value)) return unwrap(value[0])

      if (isValeur(value)) return unwrap(value.reponse?.value)

      if (typeof value === 'object' && value !== null) {
        if ('reponse' in value) {
          return unwrap(
            (value as { reponse?: { value?: unknown } }).reponse?.value,
          )
        }
        if ('value' in value) {
          return unwrap((value as { value?: unknown }).value)
        }
      }

      return value
    }

    const value = unwrap(reponse)
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'))
      return Number.isFinite(parsed) ? parsed : undefined
    }
    if (typeof value === 'number')
      return Number.isFinite(value) ? value : undefined
    if (value instanceof FractionEtendue)
      return { num: value.num, den: value.den }
    return undefined
  }

  const getPlainNumericRawValue = (
    reponse: unknown,
  ): string | number | null => {
    if (!isValeur(reponse) || !('reponse' in reponse)) return null

    const normalized = (
      reponse as {
        reponse?: { value?: unknown; options?: Record<string, unknown> }
      }
    ).reponse
    const rawValue = normalized?.value
    const options = normalized?.options ?? {}
    const optionKeys = Object.keys(options)
    const isPlainNumericContext =
      optionKeys.length === 0 ||
      (optionKeys.length === 1 && options.nombreDecimalSeulement === true)

    if (!isPlainNumericContext) return null

    if (typeof rawValue === 'number') return rawValue
    if (typeof rawValue !== 'string') return null

    const trimmed = rawValue.trim()
    if (/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) return trimmed
    return null
  }

  const inferNumericLayout = (
    reponse: unknown,
  ): { digits: number; decimals: number } | null => {
    const raw = getPlainNumericRawValue(reponse)
    if (raw == null) return null

    if (typeof raw === 'number') {
      const normalized = raw.toString()
      const [intPart, decPart = ''] = normalized.split('.')
      const integerDigits = intPart.replace('-', '').length
      return {
        digits: integerDigits + decPart.length,
        decimals: decPart.length,
      }
    }

    const normalized = raw.replace(',', '.')
    const [intPart, decPart = ''] = normalized.split('.')
    const integerDigits = intPart.replace('-', '').length
    return {
      digits: integerDigits + decPart.length,
      decimals: decPart.length,
    }
  }

  const isPlainNumericInteractiveAnswer = (reponse: unknown): boolean => {
    return getPlainNumericRawValue(reponse) != null
  }

  const ensureAMCOpenAutoCorrection = () => {
    const questionCount = Math.max(
      exercice.autoCorrection.length,
      exercice.listeQuestions.length,
      exercice.listeCorrections.length,
      exercice.question != null ? 1 : 0,
      1,
    )

    for (let i = 0; i < questionCount; i++) {
      const existing = exercice.autoCorrection[i] as
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
        exercice.autoCorrection[i] = {
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

  const firstAutoCorrection = exercice.autoCorrection.find(
    (item) => item != null,
  ) as
    | {
        reponse?: { valeur?: unknown }
        propositions?: Array<{ statut?: unknown }>
      }
    | undefined

  const firstCachedInteractiveAnswer = cachedInteractiveAutoCorrection.find(
    (item) => item?.reponse?.valeur !== undefined,
  )

  if (exercice.amcType == null) {
    if (firstAutoCorrection?.reponse?.valeur !== undefined) {
      exercice.amcType = 'AMCNum'
    } else if (
      isPlainNumericInteractiveAnswer(
        firstCachedInteractiveAnswer?.reponse?.valeur,
      )
    ) {
      exercice.amcType = 'AMCNum'
    } else if ((firstAutoCorrection?.propositions?.length ?? 0) > 0) {
      const goodAnswersCount = firstAutoCorrection!.propositions!.filter((p) =>
        Boolean(p.statut),
      ).length
      exercice.amcType = goodAnswersCount > 1 ? 'qcmMult' : 'qcmMono'
    } else {
      exercice.amcType = 'AMCOpen'
    }
  }

  if (exercice.amcReady !== true) exercice.amcReady = true

  if (exercice.amcType === 'AMCNum') {
    const questionCount = Math.max(
      exercice.autoCorrection.length,
      cachedInteractiveAutoCorrection.length,
      exercice.listeQuestions.length,
      exercice.question != null ? 1 : 0,
      1,
    )

    let canBuildNumericAutoCorrection = true

    for (let i = 0; i < questionCount; i++) {
      const existing = exercice.autoCorrection[i] as
        | {
            reponse?: { valeur?: unknown; param?: Record<string, unknown> }
            enonce?: string
          }
        | undefined

      const cached = cachedInteractiveAutoCorrection[i] as
        | { reponse?: { valeur?: unknown } }
        | undefined

      const candidateValue =
        existing?.reponse?.valeur ??
        cached?.reponse?.valeur ??
        (i === 0 ? exercice.reponse : undefined)

      const numericValue = extractAMCValue(candidateValue)
      if (numericValue === undefined) {
        canBuildNumericAutoCorrection = false
        break
      }

      const inferredLayout = inferNumericLayout(candidateValue)
      const existingParam =
        (existing?.reponse?.param as Record<string, unknown> | undefined) ?? {}
      const tpoint =
        typeof existingParam.tpoint === 'string' ? existingParam.tpoint : ','

      exercice.autoCorrection[i] = {
        ...(existing ?? {}),
        enonce:
          existing?.enonce ??
          exercice.listeQuestions[i] ??
          (i === 0 ? (exercice.question ?? '') : ''),
        reponse: {
          ...(existing?.reponse ?? {}),
          valeur: numericValue as unknown as ValeurNormalized,
          param: {
            ...existingParam,
            tpoint,
            ...(inferredLayout && existingParam.digits === undefined
              ? { digits: inferredLayout.digits }
              : {}),
            ...(inferredLayout && existingParam.decimals === undefined
              ? { decimals: inferredLayout.decimals }
              : {}),
          },
        },
      }
    }

    if (!canBuildNumericAutoCorrection) {
      // Impossible de construire une réponse numérique fiable : fallback ouvert.
      exercice.amcType = 'AMCOpen'
    }
  }

  if (exercice.amcType === 'AMCOpen') {
    ensureAMCOpenAutoCorrection()
  }

  return exercice
}

export const extractSimpleAMCValue = (
  reponse: unknown,
): number | { num: number; den: number } | undefined => {
  const unwrap = (value: unknown): unknown => {
    if (Array.isArray(value)) return unwrap(value[0])

    if (isValeur(value)) {
      return unwrap(value.reponse?.value)
    }

    if (typeof value === 'object' && value !== null) {
      if ('reponse' in value) {
        return unwrap(
          (value as { reponse?: { value?: unknown } }).reponse?.value,
        )
      }
      if ('value' in value) {
        return unwrap((value as { value?: unknown }).value)
      }
    }

    return value
  }

  const value = unwrap(reponse)

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (value instanceof FractionEtendue) {
    return { num: value.num, den: value.den }
  }

  return undefined
}

export const ensureSimpleAMCAutoCorrection = (
  exercice: IExercice,
  index: number,
) => {
  if (!exercice.amcReady) return

  const currentAutoCorrection = exercice.autoCorrection[index] as
    | {
        reponse?: { valeur?: unknown }
        propositions?: unknown[]
      }
    | undefined

  const enonceAMC = exercice.question ?? exercice.listeQuestions[index] ?? ''

  if (exercice.amcType === 'AMCNum') {
    const existingValue = currentAutoCorrection?.reponse?.valeur
    const normalizedExistingValue = extractSimpleAMCValue(existingValue)

    if (
      normalizedExistingValue !== undefined &&
      currentAutoCorrection?.reponse
    ) {
      exercice.autoCorrection[index] = {
        ...(exercice.autoCorrection[index] as Record<string, unknown>),
        enonce:
          (exercice.autoCorrection[index] as { enonce?: string })?.enonce ??
          enonceAMC,
        reponse: {
          ...currentAutoCorrection.reponse,
          valeur: normalizedExistingValue as unknown as ValeurNormalized,
          param: (
            currentAutoCorrection.reponse as {
              param?: Record<string, unknown>
            }
          ).param ?? { tpoint: ',' },
        },
      }
      return
    }

    const valeurAMC = extractSimpleAMCValue(exercice.reponse)
    if (valeurAMC === undefined) return
    exercice.autoCorrection[index] = {
      enonce: enonceAMC,
      reponse: {
        valeur: valeurAMC as unknown as ValeurNormalized,
        param: {
          tpoint: ',',
        },
      },
    }
    return
  }

  if (exercice.amcType === 'AMCOpen') {
    if ((currentAutoCorrection?.propositions?.length ?? 0) > 0) return
    exercice.autoCorrection[index] = {
      enonce: enonceAMC,
      propositions: [
        {
          texte: exercice.correction ?? '',
          statut: 3,
          sanscadre: false,
          pointilles: true,
        },
      ],
    }
  }
}
