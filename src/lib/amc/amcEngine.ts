import nunjucks from 'nunjucks'
import FractionEtendue from '../../modules/FractionEtendue'
import { elimineDoublons } from '../interactif/qcm'
import {
  arrondi,
  nombreDeChiffresDansLaPartieDecimale,
  nombreDeChiffresDansLaPartieEntiere,
  nombreDeChiffresDe,
} from '../outils/nombres'
import { lettreDepuisChiffre } from '../outils/outilString'
import { decimalToScientifique } from '../outils/texNombre'
import type { ReponseParams } from '../types'
import type {
  AMCFractionValue,
  AMCReponseValue,
  AMCUneProposition,
  AutoCorrectionAMC,
} from './types'

nunjucks.configure('templates', { autoescape: false })

// types

export type QuestionContext = {
  ref: string
  id: string
  exercice: any
  index: number
}
type QuestionQcmContext = QuestionContext & {
  type: 'qcm' | 'qcmMult'
}

export type QCMProposition = {
  texte: string
  correct: boolean
}

export type QCMNormalized = {
  type: 'qcm'
  mode: 'mono' | 'mult'
  id: string
  ref: string
  enonce: string
  layout: 'reponses' | 'reponseshoriz'
  ordered: boolean
  lastChoice: number | null
  propositions: {
    texte: string
    correct: boolean
  }[]
}
type AMCElement = {
  type: 'qcm' | 'num' | 'open'
  data: any
}

type AMCNumBlock = {
  label?: string // "Base", "Exposant", etc.
  value: number
  digits: number
  decimals: number
  sign: boolean
  options?: {
    approx?: number
    exponent?: number
    exposign?: boolean
    alsocorrect?: number
    scoreapprox?: number
    strict?: boolean
    vertical?: boolean
    Tpoint?: string
  }
}

type AMCNumNormalized = {
  ref: string
  id: string
  enonce: string
  blocks: AMCNumBlock[]
}

const AMCOpenTemplate = `\\element{ {{ ref }} }{
\\begin{question}{ {{ id }} }
{{ enonce }}
\\explain{ {{ correction }} }
\\notation{ {{ notation }} }[{{ sanscadre }}][{{ pointilles }}]
\\end{question}
}`

const AMCNumTemplate = `\\element{ {{ ref }} }{
\\begin{questionmultx}{ {{ id }} }
{{ enonce }}
{% for b in blocks %}
{% if b.label %}{{ b.label }}{% endif %}
\\AMCnumericChoices{ {{ b.value }} }{
digits={{ b.digits }},
decimals={{ b.decimals }},
sign={{ b.sign }},
{% if b.options.approx %}approx={{ b.options.approx }},{% endif %}
{% if b.options.exponent %}exponent={{ b.options.exponent }},{% endif %}
{% if b.options.exposign %}exposign={{ b.options.exposign }},{% endif %}
{% if b.options.alsocorrect %}alsocorrect={{ b.options.alsocorrect }},{% endif %}
{% if b.options.strict %}strict={{ b.options.strict }},{% endif %}
{% if b.options.vertical %}vertical={{ b.options.vertical }},{% endif %}
Tpoint={{{ b.options.Tpoint or "," }}},
borderwidth=0pt,backgroundcol=lightgray,scoreexact=1
}
{% endfor %}
\\end{questionmultx}
}`

const qcmTemplate = `\\element{ {{ ref }} }{
\\begin{ {{ "questionmult" if mode == "mult" else "question" }} }{ {{ id }} }
{{ enonce | safe }}
\\begin{ {{ layout }} }{% if ordered %}[o]{% endif %}
{% for p in propositions %}
  {% if lastChoice is defined and lastChoice is not none and loop.index0 == lastChoice %}\\lastchoices{% endif %}{% if p.correct %}\\bonne{ {{- p.texte | safe -}} }{% else %}\\mauvaise{ {{- p.texte | safe -}} }{% endif %}
{% endfor %}
\\end{ {{ layout }} }
\\end{ {{ "questionmult" if mode == "mult" else "question" }} }
}`

// helper functions
function buildAMCId(ref: string, exoIndex: number, qIndex: number): string {
  return `${ref}/${lettreDepuisChiffre(exoIndex + 1)}-${qIndex + 10}`
}

export function createIdGenerator(ref: string, idExo: number) {
  let counter = 0

  return () => {
    const id = buildAMCId(ref, idExo, counter)
    counter++
    return id
  }
}

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

function countDigits(n: number): number {
  return Math.abs(Math.trunc(n)).toString().length
}

function normalizeTexte(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function isFractionValue(value: unknown): value is AMCFractionValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AMCFractionValue).num === 'number' &&
    typeof (value as AMCFractionValue).den === 'number'
  )
}

function getDecimalValue(value: AMCReponseValue | undefined): number {
  if (typeof value === 'number') return value
  if (
    typeof value === 'object' &&
    value !== null &&
    'valeurDecimale' in value &&
    typeof value.valeurDecimale === 'number'
  ) {
    return value.valeurDecimale
  }
  return 0
}

function computeDecimalAMC(rep?: {
  valeur?: AMCReponseValue | AMCReponseValue[]
  param?: ReponseParams
}) {
  const rawValue = Array.isArray(rep?.valeur) ? rep?.valeur[0] : rep?.valeur
  let value = getDecimalValue(rawValue)
  const param = rep?.param ?? {}
  let decimals = Math.max(countDecimals(value), param.decimals ?? 0)
  let approx: number
  const alsocorrect =
    param.aussiCorrect instanceof FractionEtendue
      ? param.aussiCorrect?.valeurDecimale
      : Number(param.aussiCorrect)

  // =========================
  // 🎯 CAS INTERVALLE
  // =========================
  if (param.milieuIntervalle !== undefined) {
    const target = param.milieuIntervalle
    const delta = target - value

    const deltaDecimals = countDecimals(delta)

    decimals = Math.max(decimals, deltaDecimals)

    const scale = 10 ** decimals

    value = target

    if (param.approx === 'intervalleStrict') {
      approx = Math.round(delta * scale) - 1
    } else {
      approx = Math.round(delta * scale)
    }

    // ⚠️ dans ce cas alsocorrect n’a plus vraiment de sens
  } else {
    approx = Number(param.approx) || 0
  }

  return {
    value,
    decimals,
    approx,
    alsocorrect,
  }
}

function deduplicatePropositions(
  propositions: QCMProposition[],
): QCMProposition[] {
  const map = new Map<string, QCMProposition>()

  for (const p of propositions) {
    const key = normalizeTexte(p.texte)

    if (!map.has(key)) {
      map.set(key, { ...p })
    } else {
      const existing = map.get(key)!

      // ⚠️ cas critique : contradiction
      if (existing.correct !== p.correct) {
        console.warn(`Conflit sur "${p.texte}" : vrai/faux → on garde "vrai"`)

        // règle : on privilégie la bonne réponse
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

// normalization and rendering
function normalizeQcm(
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
    id: `${ref}/${id}`,
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

  const id = `${ref}/${idBase + index}`

  const enonce = autoCorrectionItem.enonce ?? exercice.listeQuestions[index]

  const rep = autoCorrectionItem.reponse
  const param = rep?.param ?? {}

  const valeur = Array.isArray(rep?.valeur) ? rep?.valeur[0] : rep?.valeur

  const blocks: AMCNumBlock[] = []

  // =========================
  // 🔹 CAS PUISSANCE
  // =========================
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

  // =========================
  // 🔹 CAS FRACTION
  // =========================
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

  // =========================
  // 🔹 CAS DECIMAL
  // =========================
  const { value, decimals, approx, alsocorrect } = computeDecimalAMC(rep)

  const digits = Math.max(countDecimals(value), param.digits ?? 0)
  const block: AMCNumBlock = {
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
  }

  blocks.push(block)

  return { id, ref, enonce, blocks }
}

export function renderQcm(
  autoCorrectionItem: AMCUneProposition,
  contexte: QuestionQcmContext,
) {
  const data = normalizeQcm(autoCorrectionItem, contexte)
  return nunjucks.renderString(qcmTemplate, data)
}

export function renderAMCNum(
  item: AutoCorrectionAMC,
  contexte: QuestionContext,
) {
  const data = normalizeAMCNum(item, contexte)
  return nunjucks.renderString(AMCNumTemplate, {
    ...data,
  })
}

export function renderOpen(item: AMCUneProposition, contexte: QuestionContext) {
  const data = normalizeAMCOpen(item, contexte)
  return nunjucks.renderString(AMCOpenTemplate, {
    ...data,
  })
}

export type AMCHybrideRenderParams = {
  type?: string
  autoCorrectionItem: any
  exercice: any
  ref: string
  idExo: number
  questionIndex: number
  currentId: number
  melange: boolean
}

const AMCHybrideContainerTemplate = `\\element{ {{ ref }} }{
{% if multicolsAll %}\\setlength{\\columnseprule}{ {{ "0.5" if barreseparation else "0" }}pt}\\begin{multicols}{2}
{% endif %}
{% if numerotationEnonce %}\\begin{question}{ {{ enonceId }} } \\QuestionIndicative {% endif %}
{% if enonceAGauche %}\\noindent\\fbox{\\begin{minipage}{ {{ enonceAGaucheLeft }}\\linewidth }
{% endif %}
{% if enonceCentre %}\\begin{center}{% endif %}{{ enonceTexte | safe }}{% if enonceCentre %}\\end{center}{% endif %}
{% if enonceAGauche %}\\end{minipage}}\\noindent\\begin{minipage}[t]{ {{ enonceAGaucheRight }}\\linewidth }
{% endif %}
{% if numerotationEnonce %}\\end{question}
{% endif %}
{% if multicols %}\\setlength{\\columnseprule}{ {{ "0.5" if barreseparation else "0" }}pt}\\begin{multicols}{2}
{% endif %}
{{ content | safe }}
{% if closeMulticols %}\\end{multicols}
{% endif %}
{% if enonceAGauche %}\\end{minipage}
{% endif %}
}`

const AMCHybrideQcmTemplate = `{% if disableNumber %}\\def\\AMCbeginQuestion#1#2{}\\AMCquestionNumberfalse{% endif %}
\\begin{ {{ "question" if mode == "mono" else "questionmult" }} }{ {{ id }} }
{% if enonce %}{{ enonce | safe }}
{% endif %}
\\begin{ {{ layout }} }{% if ordered %}[o]{% endif %}
{% for p in propositions %}
{% if lastChoice is not none and loop.index0 == lastChoice %}\\lastchoices
{% endif %}{% if p.statut %}\\bonne{ {{- p.texte | safe -}} }
{% else %}\\mauvaise{ {{- p.texte | safe -}} }
{% endif %}
{% endfor %}
\\end{ {{ layout }} }
\\end{ {{ "question" if mode == "mono" else "questionmult" }} }
`

const AMCHybrideOpenTemplate = `{% if multicolsBegin %}\\setlength{\\columnseprule}{ {{ "0.5" if barreseparation else "0" }}0pt}\\begin{multicols}{2}
{% endif %}
{% if disableNumber %}\\def\\AMCbeginQuestion#1#2{}\\AMCquestionNumberfalse {% endif %}\\begin{question}{ {{ id }} }{% if questionIndicative %}\\QuestionIndicative{% endif %}
{% if enonce %}{{ enonce | safe }}
{% endif %}\\explain{ {{ correction | safe }} }
\\notation{ {{ notation }} }[{{ sanscadre }}][{{ pointilles }}]
\\end{question}
{% if multicolsEnd %}\\end{multicols}
{% endif %}`

const AMCHybrideNumPowerTemplate = `{% if enonceApresNumQuestion %}\\begin{questionmultx}{ {{ enonceId }} }
{{ enonce | safe }}
\\end{questionmultx}{% endif %}
\\begin{multicols}{2}
{% if disableNumber %}\\def\\AMCbeginQuestion#1#2{}\\AMCquestionNumberfalse{% endif %}\\begin{questionmultx}{ {{ id }} }
{% if explain %}\\explain{ {{ explain | safe }} }{% endif %}
{{ texte | safe }}
\\vspace{0.25cm}
Base
\\AMCnumericChoices{ {{ baseValue }} }{digits={{ digitsBase }},decimals=0,sign={{ baseSign }},approx=0,borderwidth=0pt,backgroundcol=lightgray,scoreapprox={{ scoreapprox }},scoreexact=1,Tpoint={,}}
\\end{questionmultx}
\\AMCquestionNumberfalse\\def\\AMCbeginQuestion#1#2{}
\\begin{questionmultx}{ {{ exponentId }} }
\\vspace{18pt}
Exposant
\\AMCnumericChoices{ {{ exponentValue }} }{digits={{ digitsExponent }},decimals=0,sign=true,approx=0,borderwidth=0pt,backgroundcol=lightgray,scoreapprox={{ scoreapprox }},scoreexact=1,Tpoint={,}}
\\end{questionmultx}
\\end{multicols}
`

const AMCHybrideNumFractionTemplate = `{% if enonceApresNumQuestion %}\\begin{questionmultx}{ {{ enonceId }} }
{{ enonce | safe }}
\\end{questionmultx}{% endif %}
{% if disableNumber %}\\def\\AMCbeginQuestion#1#2{}\\AMCquestionNumberfalse{% endif %}\\begin{questionmultx}{ {{ id }} }
{% if alignement %}\\begin{ {{ alignement }} }{% endif %}
{% if showEnonce %}{{ enonce | safe }}
{% endif %}
{% if explain %}\\explain{ {{ explain | safe }} }{% endif %}
{{ texte | safe }}
\\AMCnumericChoices{ {{ value }} }{digits={{ digits }},decimals={{ decimals }},sign={{ sign }},approx=0,borderwidth=0pt,backgroundcol=lightgray,scoreexact=1,Tpoint={\\vspace{0.5cm} \\vrule height 0.4pt width 5.5cm },alsocorrect={{ alsoCorrect }}}
{% if alignement %}\\end{ {{ alignement }} }{% endif %}
\\end{questionmultx}
`

const AMCHybrideNumDecimalTemplate = `{% if enonceApresNumQuestion %}\\begin{questionmultx}{ {{ enonceId }} }
{{ enonce | safe }}
\\end{questionmultx}{% endif %}
{% if multicolsBegin %}\\setlength{\\columnseprule}{ {{ "0.5" if barreseparation else "0" }}pt}\\begin{multicols}{2}
{% endif %}
{% if disableNumber %}\\def\\AMCbeginQuestion#1#2{}\\AMCquestionNumberfalse{% endif %}
\\begin{questionmultx}{ {{ id }} }
{% if explain %}\\explain{ {{ explain | safe }} }{% endif %}
{{ texte | safe }}
{% if alignement %}\\begin{ {{ alignement }} }{% endif %}
\\AMCnumericChoices{ {{ value }} }{digits={{ digits }},decimals={{ decimals }},sign={{ sign }},{% if exponent is not none %}exponent={{ exponent }},exposign={{ exposign }},{% endif %}{% if approx %}approx={{ approx }},{% endif %}{% if vertical %}vertical={{ vertical }},{% endif %}{% if strict %}strict={{ strict }},{% endif %}{% if vhead %}vhead={{ vhead }},{% endif %}{% if alsoCorrect %}alsocorrect={{ alsoCorrect }},{% endif %}Tpoint={{{ tpoint }}},borderwidth=0pt,backgroundcol=lightgray,scoreexact=1}
{% if alignement %}\\end{ {{ alignement }} }{% endif %}
\\end{questionmultx}
{% if multicolsEnd %}\\end{multicols}
{% endif %}
`

function renderTemplate(template: string, data: Record<string, unknown>) {
  return nunjucks.renderString(template, data)
}

function asArrayValue<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function isHybridFraction(
  value: unknown,
): value is { num: number; den: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { num?: unknown }).num === 'number' &&
    typeof (value as { den?: unknown }).den === 'number'
  )
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
        typeof firstValue === 'number'
          ? firstValue
          : getDecimalValue(firstValue)
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
        const [mantisse, expo] = decimalToScientifique(decimalValue)
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
