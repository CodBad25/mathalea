import {
  computeDecimalAMC,
  countDigits,
  isFractionValue,
  normalizeTexte,
} from './amcHelpers'
import type {
  AMCNumBlock,
  AMCNumNormalized,
  AMCUneProposition,
  AutoCorrectionAMC,
  QCMNormalized,
  QCMProposition,
  QuestionContext,
  QuestionQcmContext,
} from './amcTypes'

function deduplicatePropositions(
  propositions: QCMProposition[],
): QCMProposition[] {
  const map = new Map<string, QCMProposition>()

  for (const proposition of propositions) {
    const key = normalizeTexte(proposition.texte)

    if (!map.has(key)) {
      map.set(key, { ...proposition })
    } else {
      const existing = map.get(key)!
      if (existing.correct !== proposition.correct) {
        console.warn(
          `Conflit sur "${proposition.texte}" : vrai/faux → on garde "vrai"`,
        )
        existing.correct = true
      }
    }
  }

  return Array.from(map.values())
}

function validateQCM(qcm: QCMNormalized): QCMNormalized {
  const correctCount = qcm.propositions.filter((p) => p.correct).length

  if (qcm.mode === 'mono' && correctCount !== 1) {
    console.warn('QCM mono avec != 1 bonne réponse')
  }

  if (qcm.mode === 'mult' && correctCount === 0) {
    console.warn('QCM mult sans bonne réponse')
  }

  return qcm
}

export function normalizeQcm(
  autoCorrectionItem: AMCUneProposition,
  contexte: QuestionQcmContext,
): QCMNormalized {
  const { ref, id, exercice, index } = contexte
  const options = autoCorrectionItem.options || {}
  const propositions = deduplicatePropositions(
    (autoCorrectionItem.propositions || []).map((p) => ({
      texte: p.texte ?? '',
      correct: !!p.statut,
    })),
  )

  return validateQCM({
    type: 'qcm',
    mode: contexte.type === 'qcmMult' ? 'mult' : 'mono',
    id,
    ref,
    enonce: autoCorrectionItem.enonce ?? exercice.listeQuestions[index],
    layout: options.vertical ? 'reponses' : 'reponseshoriz',
    ordered: !!options.ordered,
    lastChoice: options.lastChoice ?? null,
    propositions,
  })
}

export function normalizeAMCOpen(
  autoCorrectionItem: AMCUneProposition,
  contexte: QuestionContext,
) {
  const { ref, id, exercice, index } = contexte
  const enonce = autoCorrectionItem.enonce ?? exercice.listeQuestions[index]
  const firstProp = autoCorrectionItem.propositions?.[0]

  return {
    type: 'amcopen' as const,
    id,
    ref,
    enonce,
    correction: firstProp?.texte ?? exercice.listeCorrections[index],
    notation: firstProp?.statut ?? 3,
    sanscadre: firstProp?.sanscadre ?? false,
    pointilles: firstProp?.pointilles ?? true,
  }
}

export function normalizeAMCNum(
  autoCorrectionItem: AutoCorrectionAMC,
  contexte: QuestionContext,
): AMCNumNormalized {
  const idBase = contexte.id
  const index = contexte.index
  const ref = contexte.ref
  const exercice = contexte.exercice

  const id = idBase
  const enonce = autoCorrectionItem.enonce ?? exercice.listeQuestions[index]
  const rep = autoCorrectionItem.reponse
  const param = rep?.param ?? {}
  const valeur = Array.isArray(rep?.valeur) ? rep?.valeur[0] : rep?.valeur
  const blocks: AMCNumBlock[] = []

  if (param.basePuissance !== undefined) {
    const base = param.basePuissance
    const exp = param.exposantPuissance ?? 1000

    blocks.push({
      label: 'Base',
      value: base,
      digits: Math.max(param.baseNbChiffres ?? 0, countDigits(base)),
      decimals: 0,
      sign: base < 0 || param.signe || false,
      options: {
        approx: 0,
        scoreapprox: param.scoreapprox ?? 0.667,
        Tpoint: ',',
      },
    })

    blocks.push({
      label: 'Exposant',
      value: exp,
      digits: Math.max(param.exposantNbChiffres ?? 0, countDigits(exp)),
      decimals: 0,
      sign: true,
      options: {
        approx: 0,
        scoreapprox: param.scoreapprox ?? 0.667,
        Tpoint: ',',
      },
    })

    return { id, ref, enonce, blocks }
  }

  if (isFractionValue(valeur)) {
    const num = valeur.num
    const den = valeur.den
    const digitsNum = Math.max(
      param.digitsNum ?? param.digits ?? 0,
      countDigits(num),
    )
    const digitsDen = Math.max(
      param.digitsDen ?? param.digits ?? 0,
      countDigits(den),
    )
    const sign = param.signe !== undefined ? param.signe : num * den < 0

    let valueAMC
    let alsoCorrect

    if (num > 0) {
      valueAMC = num + den / 10 ** digitsDen
      alsoCorrect = num + den / 10 ** countDigits(den)
    } else {
      valueAMC = num - den / 10 ** digitsDen
      alsoCorrect = num - den / 10 ** countDigits(den)
    }

    blocks.push({
      value: valueAMC,
      digits: digitsNum + digitsDen,
      decimals: digitsDen,
      sign,
      options: {
        approx: 0,
        alsocorrect: alsoCorrect,
        Tpoint: '\\vspace{0.5cm} \\vrule height 0.4pt width 5.5cm ',
      },
    })

    return { id, ref, enonce, blocks }
  }

  const { value, decimals, approx, alsocorrect } = computeDecimalAMC(rep)
  const digits = Math.max(countDigits(value) + decimals, param.digits ?? 0)

  blocks.push({
    value,
    digits,
    decimals,
    sign: param.signe ?? false,
    options: {
      approx,
      exponent:
        param.exposantNbChiffres !== undefined
          ? param.exposantNbChiffres
          : undefined,
      exposign: param.exposantSigne,
      alsocorrect,
      strict: param.strict,
      vertical: param.vertical,
      Tpoint: param.tpoint ?? ',',
    },
  })

  return { id, ref, enonce, blocks }
}
