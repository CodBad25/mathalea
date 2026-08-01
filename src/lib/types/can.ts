export type CanState =
  | 'start'
  | 'countdown'
  | 'race'
  | 'end'
  | 'solutions'
  | 'canHomeScreen'
export type CanSolutionsMode = 'gathered' | 'split'
export type CanOptions = {
  durationInMinutes: number
  title: string
  subTitle: string
  isChoosen: boolean
  solutionsAccess: boolean
  solutionsMode: CanSolutionsMode
  isInteractive: boolean
  /** Course sans limite de temps : le chronomètre n'est ni affiché ni décompté. */
  isTimerDisabled: boolean
  remainingTimeInSeconds: number
  questionGetAnswer: boolean[]
  state: CanState
}
export interface ButtonWithMathaleaListener extends HTMLButtonElement {
  hasMathaleaListener: boolean
}
