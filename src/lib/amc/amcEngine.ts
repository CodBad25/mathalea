import nunjucks from 'nunjucks'
import FractionEtendue from '../../modules/FractionEtendue'
import { lettreDepuisChiffre } from '../outils/outilString'
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

export function createIdGenerator(ref: string, idExo: number) {
  let counter = 0

  return () => {
    const id = `${ref}/${lettreDepuisChiffre(idExo + 1)}-${counter + 10}`
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
  autoCorrectionItem: AutoCorrectionAMC,
  contexte: QuestionContext,
) {
  const { exercice, index, ref, id } = contexte
  const enonce = autoCorrectionItem.enonce ?? exercice.listeQuestions[index]
  const prop: AMCUneProposition = autoCorrectionItem.propositions?.[0] ?? {
    texte: exercice.listeCorrections[index],
    statut: 3,
  }

  return {
    type: 'amcopen',
    id: `${ref}/${id}`,
    ref,
    enonce,
    correction: prop.texte,
    notation: prop.statut,
    sanscadre: prop.sanscadre ?? false,
    pointilles: prop.pointilles ?? true,
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
    // return renderOpen(element.data, contexte)
  }
}
