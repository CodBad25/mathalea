import FractionEtendue from '../../../modules/FractionEtendue'
import { type AutoCorrection, type ValeurNormalized } from '../../types'
import type { AMCNumNormalized, QuestionContext } from '../types'

function countDecimals(value: number): number {
  if (!Number.isFinite(value)) return 0

  // On nettoie les erreurs flottantes
  const rounded = Number(value.toFixed(10))

  const s = rounded.toString()

  if (s.includes('e-')) {
    const [, exp] = s.split('e-')
    return parseInt(exp, 10)
  }

  const parts = s.split('.')
  return parts[1] ? parts[1].length : 0
}

export function normalizeAMCNum(
  item: AutoCorrection,
  contexte: QuestionContext,
): AMCNumNormalized {
  const { ref, id, exercice, index } = contexte

  const enonce = item.enonce ?? exercice.listeQuestions[index]

  const explain = item.propositions?.[0]?.texte

  const valeur = Array.isArray(item.reponse?.valeur)
    ? item.reponse?.valeur[0]
    : (item.reponse?.valeur ?? (0 as ValeurNormalized))

  const param = item.reponse?.param || {}

  // ⚡ CAS PUISSANCE
  if (param.basePuissance !== undefined) {
    return {
      type: 'AMCNum',
      mode: 'power',
      id,
      ref,
      enonce,
      explain,
      base: param.basePuissance,
      exponent: param.exposantPuissance ?? 1000,
      digitsBase: Math.max(
        param.baseNbChiffres ?? 0,
        Math.abs(param.basePuissance).toString().length,
      ),
      digitsExponent: Math.max(
        param.exposantNbChiffres ?? 0,
        Math.abs(param.exposantPuissance ?? 0).toString().length,
      ),
      signBase: param.basePuissance < 0,
    }
  }

  // 🧮 CAS FRACTION
  if (valeur?.num !== undefined) {
    const num = valeur.num
    const den = valeur.den

    const digitsNum = Math.max(
      param.digitsNum ?? param.digits ?? 0,
      Math.abs(num).toString().length,
    )

    const digitsDen = Math.max(
      param.digitsDen ?? param.digits ?? 0,
      Math.abs(den).toString().length,
    )

    const sign = param.signe ?? num * den < 0

    const valueAMC =
      num > 0 ? num + den / 10 ** digitsDen : num - den / 10 ** digitsDen

    const alsoCorrect =
      num > 0
        ? num + den / 10 ** den.toString().length
        : num - den / 10 ** den.toString().length

    return {
      type: 'AMCNum',
      mode: 'fraction',
      id,
      ref,
      enonce,
      explain,
      numerator: num,
      denominator: den,
      digitsNum,
      digitsDen,
      sign,
      approx: 0,
      valueAMC,
      alsoCorrect,
    }
  }

  // 🔢 CAS DECIMAL
  let v = valeur
  if (typeof v === 'string') {
    v = Number(v.replace(/\s/g, '').replace(',', '.'))
  }

  const decimals = Math.max(param.decimals ?? 0, countDecimals(v))

  const digits = Math.max(
    param.digits ?? 0,
    Math.floor(Math.abs(v)).toString().length,
  )
  const alsocorrect = (
    param.aussiCorrect !== undefined
      ? param.aussiCorrect instanceof FractionEtendue
        ? param.aussiCorrect.valeurDecimale
        : param.aussiCorrect
      : undefined
  ) as number | undefined

  const demiMediane =
    param.milieuIntervalle !== undefined
      ? Math.abs(param.milieuIntervalle - v) / 2
      : 0
  const nbChiffresPd = decimals + 1

  const approx =
    param.approx === 'intervalleStrict'
      ? demiMediane * 10 ** nbChiffresPd - 1
      : demiMediane * 10 ** nbChiffresPd

  return {
    type: 'AMCNum',
    mode: 'decimal',
    id,
    ref,
    enonce,
    explain,
    value: v,
    digits,
    decimals,
    sign: param.signe ?? v < 0,
    approx,
    options: {
      vertical: param.vertical,
      strict: param.strict,
      vhead: param.vhead,
      alsocorrect,
      exponent: param.exposantNbChiffres,
      exposign: param.exposantSigne,
    },
  }
}
