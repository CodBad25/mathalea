export { fromOptions } from './adapter'
export { all, seq } from './combinators'
export { contains } from './contains'
export { doesNotContain } from './doesNotContain'
export { equals } from './equals'
export { extractedRadicands } from './extractedRadicands'
export { irreducibleFractions } from './irreducibleFractions'
export { isReduced } from './isReduced'
export { noDecimal } from './noDecimal'
export {
  distributed,
  noNumericComputation,
  noTrivialFactor,
  termsGrouped,
} from './reductionAtoms'
export { sameDescribedSet } from './sameDescribedSet'
export { sameParametricLine } from './sameParametricLine'
export { setEquality } from './setEquality'
export { singleParameterVariable } from './singleParameterVariable'
export { stringComparison, stringEquals } from './stringEquals'
export type {
  Check,
  CheckFactory,
  CheckOverrides,
  CheckResult,
  Comparator,
  CompareResult,
  EqualsOptions,
  StringEqualsOptions,
} from './types'
