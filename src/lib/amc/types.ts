import type { IExercice, ReponseParams } from '../types'

export type AMCExportType =
  | 'qcmMono'
  | 'qcmMult'
  | 'AMCOpen'
  | 'AMCNum'
  | 'AMCHybride'

/**
 * Extension d'IExercice réservée au rendu AMC.
 * autoCorrection est ici typé avec AutoCorrectionAMC (structures AMC) au lieu de AutoCorrection (structures interactif HTML).
 */
export type IExerciceAMC = Omit<IExercice, 'autoCorrection'> & {
  autoCorrection: AutoCorrectionAMC[]
  amcType?: AMCExportType | string
}

export type AMCStatut = number | boolean | string

export type AMCFractionValue = {
  num: number
  den: number
}

export type AMCReponseValue =
  | number
  | AMCFractionValue
  | {
      num?: number
      den?: number
      valeurDecimale?: number
      [key: string]: unknown
    }

export type AMCQcmChoice = {
  texte?: string
  statut?: AMCStatut
  sanscadre?: boolean | number
  enonce?: string
  feedback?: string
  multicolsBegin?: boolean
  multicolsEnd?: boolean
  numQuestionVisible?: boolean
  pointilles?: boolean | number
}

export type AMCUneProposition = {
  texte?: string
  statut?: AMCStatut
  sanscadre?: boolean | number
  multicolsBegin?: boolean
  multicolsEnd?: boolean
  numQuestionVisible?: boolean
  type?: string
  feedback?: string
  pointilles?: boolean | number
  enonce?: string
  propositions?: AMCQcmChoice[]
  options?: {
    ordered?: boolean
    vertical?: boolean
    lastChoice?: number
    barreseparation?: boolean
    multicols?: boolean
    nbCols?: number
    digits?: number
    decimals?: number
    signe?: boolean
    exposantNbChiffres?: number
    exposantSigne?: boolean
    approx?: number
    multicolsAll?: boolean
    numerotationEnonce?: boolean
    avecSymboleMult?: boolean
  }
  reponse?: {
    valeur?: AMCReponseValue | AMCReponseValue[]
    param?: ReponseParams
    textePosition?: string
    texte?: string
    alignement?: string
  }
}

export interface AutoCorrectionAMC {
  enonce?: string
  enonceAvant?: boolean
  melange?: boolean
  enonceAGauche?: boolean | [number, number]
  enonceAvantUneFois?: boolean
  enonceCentre?: boolean
  enonceApresNumQuestion?: boolean
  propositions?: AMCUneProposition[]
  reponse?: {
    valeur?: AMCReponseValue | AMCReponseValue[]
    param?: ReponseParams
    textePosition?: string
    texte?: string
  }
  options?: {
    radio?: boolean
    ordered?: boolean
    vertical?: boolean
    lastChoice?: number
    barreseparation?: boolean
    multicols?: boolean
    nbCols?: number
    digits?: number
    decimals?: number
    signe?: boolean
    exposantNbChiffres?: number
    exposantSigne?: boolean
    approx?: number
    multicolsAll?: boolean
    numerotationEnonce?: boolean
    avecSymboleMult?: boolean
  }
}
export type QuestionContext = {
  ref: string
  id: string
  exercice: any
  index: number
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

type AMCNumDecimal = AMCNumBase & {
  mode: 'decimal'
  value: number
  digits: number
  decimals: number
  sign: boolean
  approx: number
  options: {
    vertical?: boolean
    strict?: boolean
    vhead?: boolean
    alsocorrect?: number
    exponent?: number
    exposign?: boolean
  }
}

type AMCNumFraction = AMCNumBase & {
  mode: 'fraction'
  numerator: number
  denominator: number
  digitsNum: number
  digitsDen: number
  sign: boolean
  approx: number
  valueAMC: number
}

type AMCNumPower = AMCNumBase & {
  mode: 'power'
  base: number
  exponent: number
  digitsBase: number
  digitsExponent: number
  signBase: boolean
}

export type AMCNumNormalized = AMCNumDecimal | AMCNumFraction | AMCNumPower

export type AMCNumBase = {
  type: 'AMCNum'
  id: string
  ref: string
  enonce: string
  explain?: string
  alsoCorrect: number
  Tpoint: string
}
