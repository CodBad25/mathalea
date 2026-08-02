import type { MathfieldElement } from 'mathlive'
import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { verifyFillInTheBlankMathLive } from '../../src/lib/interactif/mathLiveVerifications'
import { setOutputHtml } from '../../src/modules/context'

describe('FillInTheBlankElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('verrouille le mathfield interne apres verification', () => {
    const exercice = new Exercice()
    exercice.numeroExercice = 3
    handleAnswers(
      exercice,
      0,
      { champ1: { value: '2' } },
      { formatInteractif: 'fill-in-the-blank' },
    )
    document.body.innerHTML = '<span id="resultatCheckEx3Q0"></span>'

    const mathfield = document.createElement(
      'div',
    ) as unknown as MathfieldElement
    mathfield.id = 'champTexteEx3Q0'
    const promptStates = new Map<string, { state: unknown; locked: boolean }>()
    mathfield.getPrompts = () => ['champ1', 'champ2']
    mathfield.getPromptValue = (id: string) => (id === 'champ1' ? '2' : '')
    mathfield.getValue = () => '\\placeholder[champ1]{2}'
    mathfield.setPromptState = (id, state, locked = false) => {
      promptStates.set(id, { state, locked })
    }
    mathfield.readOnly = false

    const result = verifyFillInTheBlankMathLive(exercice, 0, mathfield)

    expect(result.isOk).toBe(true)
    expect(mathfield.classList.contains('corrected')).toBe(true)
    expect(mathfield.readOnly).toBe(true)
    expect(promptStates.get('champ1')?.locked).toBe(true)
    expect(promptStates.get('champ2')?.locked).toBe(true)
  })
})
