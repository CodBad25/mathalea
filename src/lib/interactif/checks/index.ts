export { fromOptions } from './adapter'
export { all, seq } from './combinators'
export { contains } from './contains'
export { doesNotContain } from './doesNotContain'
export { isEqual } from './isEqual'
export { extractedRadicands } from './extractedRadicands'
export {
  fractionReducedFromExpected,
  noSquareRootInDenominator,
} from './fractionFormChecks'
export {
  coordinatesReduced,
  hasGroupedNumberSpacing,
  intervalBoundsReduced,
  isDecimalFraction,
  onlyDecimalNumbers,
  isFraction,
  isPowerForm,
  isScientificNotation,
  noTrigonometry,
} from './formAtoms'
export { onlyIrreducibleFractions } from './onlyIrreducibleFractions'
export { isReduced } from './isReduced'
export {
  sameWithUnit,
  sameCoordinates,
  sameDuration,
  sameInterval,
  sameNumberList,
  sameNumberTuple,
  sameOrderedNumberList,
  valueInInterval,
} from './legacyDomainChecks'
export { noDecimal } from './noDecimal'
export {
  isDistributed,
  noNumericComputation,
  noTrivialFactor,
  termsGrouped,
} from './reductionAtoms'
export { hasZeroMember, isEquation, isEquivalentEquation } from './equationChecks'
export { sameDescribedSet } from './sameDescribedSet'
export { sameParametricLine } from './sameParametricLine'
export { sameSet } from './sameSet'
export { singleParameterVariable } from './singleParameterVariable'
export { stringComparison, stringEquals } from './stringEquals'
export { sameParametricZeroSet } from './sameParametricZeroSet'
export type { ParametricZeroSetProgression } from './sameParametricZeroSet'
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
