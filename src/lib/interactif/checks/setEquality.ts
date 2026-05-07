import { fromOptions } from './adapter'
import type { Check, CheckOverrides } from './types'

type SetEqualityOptions = CheckOverrides & {
  variable?: string
}

export function setEquality(options: SetEqualityOptions = {}): Check {
  return fromOptions(
    { ensembleDeNombres: true, variable: options.variable },
    {
      ...options,
      name: options.name ?? 'setEquality',
    },
  )
}
