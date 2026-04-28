import { elimineDoublons } from '../interactif/qcm'
import {
  arrondi,
  nombreDeChiffresDansLaPartieDecimale,
  nombreDeChiffresDansLaPartieEntiere,
  nombreDeChiffresDe,
} from '../outils/nombres'
import { decimalToScientifique } from '../outils/texNombre'
import { asArrayValue, buildAMCId, isHybridFraction } from './amcHelpers'
import { normalizeAMCNum, normalizeAMCOpen, normalizeQcm } from './amcNormalize'
import {
  AMCHybrideContainerTemplate,
  AMCHybrideNumDecimalTemplate,
  AMCHybrideNumFractionTemplate,
  AMCHybrideNumPowerTemplate,
  AMCHybrideOpenTemplate,
  AMCHybrideQcmTemplate,
  AMCNumTemplate,
  AMCOpenTemplate,
  qcmTemplate,
  renderTemplate,
} from './amcTemplates'
import type {
  AMCElement,
  AMCHybrideRenderParams,
  AMCUneProposition,
  AutoCorrectionAMC,
  QuestionContext,
  QuestionQcmContext,
} from './amcTypes'

export function renderQcm(
  autoCorrectionItem: AMCUneProposition,
  contexte: QuestionQcmContext,
) {
  const data = normalizeQcm(autoCorrectionItem, contexte)
  return renderTemplate(qcmTemplate, data)
}

export function renderAMCNum(
  item: AutoCorrectionAMC,
  contexte: QuestionContext,
) {
  const data = normalizeAMCNum(item, contexte)
  return renderTemplate(AMCNumTemplate, {
    ...data,
  })
}

export function renderOpen(item: AMCUneProposition, contexte: QuestionContext) {
  const data = normalizeAMCOpen(item, contexte)
  return renderTemplate(AMCOpenTemplate, {
    ...data,
  })
}

export function renderAMCHybride(params: AMCHybrideRenderParams): {
  texQr: string
  nextId: number
  melange: boolean
} {
  const {
    type,
    autoCorrectionItem,
    exercice,
    ref,
    idExo,
    questionIndex,
    currentId,
  } = params

  let id = currentId
  const item = autoCorrectionItem ?? {}
  let melange = params.melange

  if (type !== 'AMCHybride') {
    ;(
      window as { notify?: (message: string, payload?: unknown) => void }
    ).notify?.(
      'exportQcmAMC : Il doit y avoir une erreur de type AMC, je ne connais pas le type : ',
      { type },
    )
  }

  item.enonce = item.enonce ?? exercice.listeQuestions[questionIndex]
  if (item.enonce === undefined || item.propositions === undefined) {
    return { texQr: '', nextId: id, melange }
  }

  if (item.melange !== undefined) {
    melange = item.melange
  }

  const opts = item.options ?? {}
  const props: any[] = item.propositions ?? []
  const blocks: string[] = []

  for (let qr = 0; qr < props.length; qr++) {
    const prop = props[qr] ?? {}
    const qType = prop.type
    const propositions: any[] = prop.propositions ?? []

    if (qType === 'qcmMono' || qType === 'qcmMult') {
      elimineDoublons(propositions)
      const pOpts = prop.options ?? {}
      const disableNumber =
        (qr > 0 &&
          (qType === 'qcmMono' ||
            (qType === 'qcmMult' && !opts.avecSymboleMult))) ||
        !!opts.numerotationEnonce

      blocks.push(
        renderTemplate(AMCHybrideQcmTemplate, {
          disableNumber,
          mode: qType === 'qcmMono' ? 'mono' : 'mult',
          id: buildAMCId(ref, idExo, id),
          enonce: prop.enonce,
          layout: pOpts.vertical === undefined ? 'reponseshoriz' : 'reponses',
          ordered: !!pOpts.ordered,
          lastChoice: pOpts.lastChoice ?? null,
          propositions,
        }),
      )
      id++
      continue
    }

    if (qType === 'AMCOpen') {
      const p0 = propositions[0] ?? {}
      blocks.push(
        renderTemplate(AMCHybrideOpenTemplate, {
          multicolsBegin: !!p0.multicolsBegin,
          barreseparation: !!opts.barreseparation,
          disableNumber: qr > 0 || p0.numQuestionVisible === false,
          questionIndicative: p0.numQuestionVisible === false,
          id: buildAMCId(ref, idExo, id),
          enonce: p0.enonce,
          correction: p0.texte ?? '',
          notation: p0.statut ?? '3',
          sanscadre: !isNaN(p0.sanscadre) ? p0.sanscadre : 'false',
          pointilles: !isNaN(p0.pointilles) ? p0.pointilles : 'true',
          multicolsEnd: !!p0.multicolsEnd,
        }),
      )
      id++
      continue
    }

    if (qType === 'AMCNum') {
      const p0 = propositions[0] ?? {}
      const rep = p0.reponse ?? {}
      const repParam = rep.param ?? {}
      const repValue = asArrayValue(rep.valeur)
      const firstValue = repValue[0]
      const enonceApresNumQuestion =
        qr === 0 &&
        item.enonceApresNumQuestion !== undefined &&
        !!item.enonceApresNumQuestion
      const disableNumber = qr > 0 || enonceApresNumQuestion

      if (repParam.basePuissance !== undefined) {
        const base = repParam.basePuissance
        const exp = repParam.exposantPuissance ?? 1000
        const digitsBase =
          repParam.baseNbChiffres !== undefined
            ? Math.max(
                repParam.baseNbChiffres,
                nombreDeChiffresDansLaPartieEntiere(base),
              )
            : nombreDeChiffresDansLaPartieEntiere(base)
        const digitsExponent =
          repParam.exposantNbChiffres !== undefined
            ? Math.max(
                repParam.exposantNbChiffres,
                nombreDeChiffresDansLaPartieEntiere(exp),
              )
            : nombreDeChiffresDansLaPartieEntiere(exp)

        blocks.push(
          renderTemplate(AMCHybrideNumPowerTemplate, {
            enonceApresNumQuestion,
            enonceId: `Enonce-${buildAMCId(ref, idExo, id)}`,
            enonce: item.enonce,
            disableNumber,
            id: buildAMCId(ref, idExo, id),
            explain: p0.texte,
            texte: rep.texte ?? '',
            baseValue: base,
            digitsBase,
            baseSign: base < 0 ? 'true' : 'false',
            scoreapprox: repParam.scoreapprox || 0.667,
            exponentId: buildAMCId(ref, idExo, id + 1),
            exponentValue: exp,
            digitsExponent,
          }),
        )
        id += 2
        continue
      }

      if (isHybridFraction(firstValue)) {
        const digitsNum =
          repParam.digitsNum !== undefined
            ? Math.max(
                repParam.digitsNum,
                nombreDeChiffresDansLaPartieEntiere(firstValue.num),
              )
            : repParam.digits !== undefined
              ? Math.max(
                  repParam.digits,
                  nombreDeChiffresDansLaPartieEntiere(firstValue.num),
                )
              : nombreDeChiffresDansLaPartieEntiere(firstValue.num)

        const digitsDen =
          repParam.digitsDen !== undefined
            ? Math.max(
                repParam.digitsDen,
                nombreDeChiffresDansLaPartieEntiere(firstValue.den),
              )
            : repParam.digits !== undefined
              ? Math.max(
                  repParam.digits,
                  nombreDeChiffresDansLaPartieEntiere(firstValue.den),
                )
              : nombreDeChiffresDansLaPartieEntiere(firstValue.den)

        const sign =
          repParam.signe !== undefined
            ? repParam.signe
            : firstValue.num * firstValue.den < 0

        const value =
          firstValue.num > 0
            ? arrondi(
                firstValue.num + firstValue.den / 10 ** digitsDen,
                digitsDen,
              )
            : arrondi(
                firstValue.num - firstValue.den / 10 ** digitsDen,
                digitsDen,
              )

        const alsoCorrect =
          firstValue.num > 0
            ? arrondi(
                firstValue.num +
                  firstValue.den /
                    10 ** nombreDeChiffresDansLaPartieEntiere(firstValue.den),
                8,
              )
            : arrondi(
                firstValue.num -
                  firstValue.den /
                    10 ** nombreDeChiffresDansLaPartieEntiere(firstValue.den),
                8,
              )

        blocks.push(
          renderTemplate(AMCHybrideNumFractionTemplate, {
            enonceApresNumQuestion,
            enonceId: buildAMCId(ref, idExo, id) + 'Enonce',
            disableNumber,
            id: buildAMCId(ref, idExo, id),
            enonce: item.enonce,
            showEnonce: !enonceApresNumQuestion,
            explain: p0.texte,
            texte: rep.texte ?? '',
            alignement: p0.reponse?.alignement,
            value,
            digits: digitsNum + digitsDen,
            decimals: digitsDen,
            sign,
            alsoCorrect,
          }),
        )
        id += 2
        continue
      }

      const decimalValue =
        typeof firstValue === 'number' ? firstValue : Number(firstValue ?? 0)
      let nbChiffresPd = Math.max(
        nombreDeChiffresDansLaPartieDecimale(decimalValue),
        repParam.decimals ?? 0,
      )
      let nbChiffresPe = Math.max(
        nombreDeChiffresDansLaPartieEntiere(decimalValue),
        isNaN((repParam.digits ?? 0) - nbChiffresPd)
          ? nombreDeChiffresDe(decimalValue - nbChiffresPd)
          : (repParam.digits ?? 0) - nbChiffresPd,
      )

      let exponent: number | null = null
      if (
        repParam.exposantNbChiffres !== undefined &&
        repParam.exposantNbChiffres !== 0
      ) {
        const scientifique = decimalToScientifique(decimalValue)
        if (scientifique) {
          const [mantisse, expo] = scientifique
          nbChiffresPd = Math.max(
            nombreDeChiffresDansLaPartieDecimale(mantisse),
            repParam.decimals ?? 0,
          )
          nbChiffresPe = Math.max(
            nombreDeChiffresDansLaPartieEntiere(mantisse),
            (repParam.digits ?? 0) - nbChiffresPd || 0,
          )
          exponent = Math.max(
            nombreDeChiffresDansLaPartieEntiere(expo),
            repParam.exposantNbChiffres,
          )
        }
      }

      const value = repParam.milieuIntervalle ?? decimalValue
      const approx =
        repParam.approx && repParam.approx !== 0 ? repParam.approx : null

      blocks.push(
        renderTemplate(AMCHybrideNumDecimalTemplate, {
          enonceApresNumQuestion,
          enonceId: buildAMCId(ref, idExo, id) + 'Enonce',
          multicolsBegin: !!p0.multicolsBegin,
          multicolsEnd: !!p0.multicolsEnd,
          barreseparation: !!opts.barreseparation,
          disableNumber,
          id: buildAMCId(ref, idExo, id),
          explain: p0.texte,
          texte: rep.texte ?? '',
          alignement: p0.reponse?.alignement,
          value,
          digits: nbChiffresPe + nbChiffresPd,
          decimals: nbChiffresPd,
          sign: repParam.signe,
          exponent,
          exposign: repParam.exposantSigne,
          approx,
          vertical: repParam.vertical,
          strict: repParam.strict,
          vhead: repParam.vhead,
          alsoCorrect: repParam.aussiCorrect,
          tpoint: repParam.tpoint ?? ',',
        }),
      )
      id++
    }
  }

  const enonceTexte =
    item.enonceAvant === undefined
      ? `${item.enonce} ${item.enonceCentre !== undefined || item.enonceCentre ? '' : '\n '}`
      : item.enonceAvant
        ? `${item.enonce} ${item.enonceCentre !== undefined || item.enonceCentre ? '' : '\n '}`
        : item.enonceAvantUneFois && questionIndex === 0
          ? `${item.enonce} ${item.enonceCentre !== undefined || item.enonceCentre ? '' : '\n '}`
          : ''

  const texQr = renderTemplate(AMCHybrideContainerTemplate, {
    ref,
    multicolsAll: !!opts.multicolsAll,
    barreseparation: !!opts.barreseparation,
    numerotationEnonce: !!opts.numerotationEnonce,
    enonceId: buildAMCId(ref, idExo, currentId + 10) + 'Enonce',
    enonceAGauche:
      Array.isArray(item.enonceAGauche) && item.enonceAGauche.length === 2,
    enonceAGaucheLeft: Array.isArray(item.enonceAGauche)
      ? item.enonceAGauche[0]
      : 0.5,
    enonceAGaucheRight: Array.isArray(item.enonceAGauche)
      ? item.enonceAGauche[1]
      : 0.5,
    enonceCentre: item.enonceCentre !== undefined || item.enonceCentre,
    enonceTexte,
    multicols: !!opts.multicols && !opts.multicolsAll,
    closeMulticols: !!opts.multicols || !!opts.multicolsAll,
    content: blocks.join('\n'),
  })

  return { texQr, nextId: id, melange }
}

export function renderElement(
  element: AMCElement,
  contexte: QuestionContext | QuestionQcmContext,
) {
  switch (element.type) {
    case 'qcm':
      return renderQcm(element.data, contexte as QuestionQcmContext)
    case 'num':
      return renderAMCNum(element.data, contexte)
    case 'open':
      return renderOpen(element.data, contexte)
  }
}
