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
  alsoCorrect: number
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
}
