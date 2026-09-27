import { describe, expect, it } from 'vitest'
import {
  buildDataKeyboardFromStyle,
  convertKeyboardTypeToBlocks,
  KeyboardType,
} from './keyboard'

describe('clavierEntierementPersonnalisable', () => {
  it('ne demande aucun bloc habituel', () => {
    expect(
      convertKeyboardTypeToBlocks('clavierEntierementPersonnalisable'),
    ).toEqual([])
  })

  it('reste vide plutôt que de retomber sur le clavier par défaut', () => {
    expect(
      buildDataKeyboardFromStyle(
        KeyboardType.clavierEntierementPersonnalisable!,
      ),
    ).toEqual([])
  })

  it('un style vide ou inconnu retombe bien sur le clavier par défaut', () => {
    const clavierParDefaut = ['numbers', 'fullOperations', 'variables']
    expect(buildDataKeyboardFromStyle('')).toEqual(clavierParDefaut)
    expect(buildDataKeyboardFromStyle('unStyleInconnu')).toEqual(
      clavierParDefaut,
    )
  })
})
