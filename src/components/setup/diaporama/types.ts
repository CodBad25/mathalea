import type { IExercice, InterfaceParams } from '../../../lib/types'

export type Vue = {
  consigne: string
  question: string
  correction: string
  consigneSvgs: string[]
  questionSvgs: string[]
  correctionSvgs: string[]
  consigneText: string
  questionText: string
  correctionText: string
  key: string
}

export type Slide = {
  exercise: IExercice
  isSelected: boolean
  vues: Vue[]
}

export type Slideshow = {
  slides: Slide[]
  currentQuestion: number
  selectedQuestionsNumber: number
}

export type Serie = {
  consignes: string[]
  questions: string[]
  corrections: string[]
  keys: string[]
}

export type SlideshowHistoryOptions = {
  nbVues: 1 | 2 | 3 | 4
  flow: 0 | 1 | 2
  screenBetweenSlides: boolean
  sound: 0 | 2 | 1 | 3 | 4 | undefined
  shuffle: boolean
  manualMode: boolean
  pauseAfterEachQuestion: boolean
  isImagesOnSides: boolean
  select?: number[]
  order?: number[]
  durationGlobal?: number
}

export type SlideshowHistoryItem = {
  options: SlideshowHistoryOptions
  exercicesParams: InterfaceParams[]
}
