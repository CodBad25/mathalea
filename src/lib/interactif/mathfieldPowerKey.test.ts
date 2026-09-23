import type { MathfieldElement } from 'mathlive'
import { describe, expect, it, vi } from 'vitest'
import { handleMathfieldPowerKeydown } from './mathfieldPowerKey'

function keydown(key: string, code: string, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    code,
    cancelable: true,
    ...options,
  })
  const executeCommand = vi.fn()
  const mf = {
    isSelectionEditable: true,
    mode: 'math',
    executeCommand,
  } as unknown as MathfieldElement
  handleMathfieldPowerKeydown(event, mf)
  return { event, executeCommand }
}

describe('touche puissance des champs MathLive', () => {
  it.each([
    ['^', 'Slash'],
    ['^', 'Digit6'],
    ['Dead', 'BracketLeft'],
  ])('insère une puissance avec %s sur %s', (key, code) => {
    const { event, executeCommand } = keydown(key, code)
    expect(event.defaultPrevented).toBe(true)
    expect(executeCommand).toHaveBeenCalledWith('moveToSuperscript')
  })

  it.each([
    ['/', 'Slash', {}],
    ['Dead', 'BracketLeft', { shiftKey: true }],
    ['^', 'Slash', { ctrlKey: true }],
  ])('préserve les autres raccourcis (%s)', (key, code, options) => {
    const { event, executeCommand } = keydown(key, code, options)
    expect(event.defaultPrevented).toBe(false)
    expect(executeCommand).not.toHaveBeenCalled()
  })
})
