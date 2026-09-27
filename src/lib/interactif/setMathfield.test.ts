import type { MathfieldElement } from 'mathlive'
import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'
import { keyboardState } from '../../components/keyboard/stores/keyboardStore'
import { setMathfield } from './setMathfield'

function creeMathfieldFactice(dataKeyboard: string): MathfieldElement {
  const div = document.createElement('div')
  div.setAttribute('data-keyboard', dataKeyboard)
  return div as unknown as MathfieldElement
}

describe('setMathfield / handleFocusMathField', () => {
  it('data-keyboard="" (clavierEntierementPersonnalisable) ne charge aucun bloc habituel', () => {
    const mf = creeMathfieldFactice('')
    setMathfield(mf)
    mf.dispatchEvent(new Event('focus'))
    expect(get(keyboardState).blocks).toEqual([])
  })

  it('un data-keyboard renseigné retrouve bien ses blocs', () => {
    const mf = creeMathfieldFactice('numbers basicOperations')
    setMathfield(mf)
    mf.dispatchEvent(new Event('focus'))
    expect(get(keyboardState).blocks).toEqual(['numbers', 'basicOperations'])
  })

  it("l'absence totale de data-keyboard retombe sur le clavier par défaut", () => {
    const div = document.createElement('div')
    const mf = div as unknown as MathfieldElement
    setMathfield(mf)
    mf.dispatchEvent(new Event('focus'))
    expect(get(keyboardState).blocks).toEqual([
      'numbers',
      'fullOperations',
      'variables',
    ])
  })
})
