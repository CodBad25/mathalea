import type { IExercice, ReponseParams } from '../types'

export type AMCExportType =
  | 'qcmMono'
  | 'qcmMult'
  | 'AMCOpen'
  | 'AMCNum'
  | 'AMCHybride'

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
  reponse?: {
    texte?: string
    valeur?: AMCReponseValue | AMCReponseValue[]
    alignement?: string
    param?: ReponseParams
  }
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

export type IExerciceAMC = Omit<IExercice, 'autoCorrection'> & {
  autoCorrection: AutoCorrectionAMC[]
  amcType?: AMCExportType | string
}

export type QuestionContext = {
  ref: string
  id: string
  exercice: any
  index: number
}

export type QuestionQcmContext = QuestionContext & {
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
  propositions: QCMProposition[]
}

export type AMCNumBlock = {
  label?: string
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

export type AMCNumNormalized = {
  ref: string
  id: string
  enonce: string
  blocks: AMCNumBlock[]
}

export type AMCElement = {
  type: 'qcm' | 'num' | 'open'
  data: any
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
