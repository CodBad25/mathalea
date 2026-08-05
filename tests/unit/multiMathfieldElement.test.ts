import type { MathfieldElement } from 'mathlive'
import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { MultiMathfieldElement } from '../../src/lib/customElements/MultiMathfield'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml } from '../../src/modules/context'

describe('MultiMathfieldElement', () => {
  beforeEach(() => {
    setOutputHtml()
    document.body.innerHTML = ''
  })

  it('hydrate exercice.answers avec la value de l element apres verification', () => {
    const exercice = new Exercice()
    exercice.numeroExercice = 2
    handleAnswers(
      exercice,
      0,
      { champ1: { value: '3' }, champ2: { value: 'x+1' } },
      { formatInteractif: 'multi-mathfield' },
    )
    exercice.answers = undefined

    const multi = document.createElement('div')
    multi.id = 'multi-mathfieldEx2Q0'
    multi.setAttribute('data-template', 'a) %{champ1} b) %{champ2}')
    const shadowRoot = multi.attachShadow({ mode: 'open' })

    for (const [field, value] of Object.entries({
      champ1: '3',
      champ2: 'x+1',
    })) {
      const mathfield = document.createElement(
        'div',
      ) as unknown as MathfieldElement
      mathfield.id = `multi-mathfieldEx2Q0-${field}`
      mathfield.setAttribute('data-name', field)
      mathfield.getValue = () => value
      mathfield.readOnly = false
      shadowRoot.appendChild(mathfield)

      const checkSpan = document.createElement('span')
      checkSpan.id = `check-multi-mathfieldEx2Q0-${field}`
      shadowRoot.appendChild(checkSpan)
    }
    document.body.appendChild(multi)
    const resultSpan = document.createElement('span')
    resultSpan.id = 'resultatCheckEx2Q0'
    document.body.appendChild(resultSpan)

    const result = MultiMathfieldElement.verifQuestion(exercice, 0)

    expect(result.isOk).toBe(true)
    expect(exercice.answers).toEqual({
      'multi-mathfieldEx2Q0': '{"champ1":"3","champ2":"x+1"}',
    })
  })

  it('rehydrate mathfields et listes deroulantes depuis sa value', () => {
    const source = new MultiMathfieldElement()
    const sourceMathfield = document.createElement(
      'math-field',
    ) as MathfieldElement
    sourceMathfield.setAttribute('data-name', 'champ1')
    sourceMathfield.value = '42'
    source.shadowRoot?.appendChild(sourceMathfield)

    const sourceList = document.createElement('liste-deroulante') as HTMLElement & {
      choices: Array<{ label: string; value: string }>
      value: string
    }
    sourceList.setAttribute('data-name', 'choix')
    sourceList.choices = [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]
    sourceList.value = 'B'
    source.shadowRoot?.appendChild(sourceList)

    const savedValue = source.value

    const target = new MultiMathfieldElement()
    const targetMathfield = document.createElement(
      'math-field',
    ) as MathfieldElement
    targetMathfield.setAttribute('data-name', 'champ1')
    targetMathfield.value = ''
    target.shadowRoot?.appendChild(targetMathfield)

    const targetList = document.createElement('liste-deroulante') as HTMLElement & {
      choices: Array<{ label: string; value: string }>
      value: string
    }
    targetList.setAttribute('data-name', 'choix')
    targetList.choices = [
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]
    targetList.value = ''
    target.shadowRoot?.appendChild(targetList)

    target.value = savedValue

    expect(savedValue).toBe('{"champ1":"42","choix":"B"}')
    expect(target.getValue()).toEqual({ champ1: '42', choix: 'B' })
  })
})
