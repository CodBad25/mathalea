import type { IFractionEtendue } from '../../modules/FractionEtendue.type'
import type {
  IExercice,
  InteractivityType,
  OldFormatInteractifType,
} from '../types'
export interface ReponseParams {
  digits?: number
  decimals?: number
  signe?: boolean
  exposantNbChiffres?: number
  exposantSigne?: boolean
  approx?: number | 'intervalleStrict'
  aussiCorrect?: number | IFractionEtendue
  digitsNum?: number
  digitsDen?: number
  basePuissance?: number
  exposantPuissance?: number
  baseNbChiffres?: number
  milieuIntervalle?: number
  formatInteractif?: InteractivityType | OldFormatInteractifType
  precision?: number
  scoreapprox?: number
  vertical?: boolean
  strict?: boolean
  vhead?: boolean
  tpoint?: string
}
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

export type AMCDisplayAlignment = 'flushleft' | 'center' | 'flushright'

export type AMCReponseDisplay = {
  label?: string
  labelPosition?: 'left' | 'right'
  align?: AMCDisplayAlignment
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
    display?: AMCReponseDisplay
  }
}

export type AMCLayoutOptions = {
  radio?: boolean
  ordered?: boolean
  vertical?: boolean
  lastChoice?: number
  barreseparation?: boolean
  multicols?: boolean
  nbCols?: number
  multicolsAll?: boolean
  numerotationEnonce?: boolean
  avecSymboleMult?: boolean
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
  options?: AMCLayoutOptions
  reponse?: {
    valeur?: AMCReponseValue | AMCReponseValue[]
    param?: ReponseParams
    display?: AMCReponseDisplay
    // Compat legacy
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
    display?: AMCReponseDisplay
    // Compat legacy
    textePosition?: string
    texte?: string
    alignement?: string
  }
  options?: AMCLayoutOptions
}

export type IExerciceAMC = Omit<IExercice, 'autoCorrectionAMC'> & {
  autoCorrectionAMC: AutoCorrectionAMC[]
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
  multicols?: boolean
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
  multicols?: boolean
  display?: AMCReponseDisplay
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
