import type { Comparator } from './types'
import {
  expectedCoordinates,
  parametricSystemFromValues,
  type LineDimension,
} from './parametricSystem'

type SameParametricLineFromFieldsOptions = {
  compare: Comparator
  dimension?: LineDimension
  numeroExercice?: number
  question: number
}

export function compareSameParametricLineFromFields({
  compare,
  numeroExercice,
  question,
  dimension = 3,
}: SameParametricLineFromFieldsOptions) {
  const coordinates = expectedCoordinates(dimension)

  return (_saisie: string, answer: string) => {
    const mathfield = globalThis.document?.querySelector(
      `#champTexteEx${numeroExercice ?? 0}Q${question}`,
    ) as { getPromptValue?: (key: string) => string } | null

    const values = Object.fromEntries(
      coordinates.map((_, index) => [
        `champ${index + 1}`,
        mathfield?.getPromptValue?.(`champ${index + 1}`) ?? '',
      ]),
    )
    const system = parametricSystemFromValues(values, dimension)
    return compare(system, answer)
  }
}
