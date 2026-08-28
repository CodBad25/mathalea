import type { MathfieldElement } from 'mathlive'
import { beforeEach, describe, expect, it } from 'vitest'
import Exercice from '../../src/exercices/Exercice'
import { MultiMathfieldElement } from '../../src/lib/customElements/MultiMathfield'
import { handleAnswers } from '../../src/lib/interactif/gestionInteractif'
import { setOutputHtml, setOutputLatex } from '../../src/modules/context'

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

    const sourceList = document.createElement(
      'liste-deroulante',
    ) as HTMLElement & {
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

    const targetList = document.createElement(
      'liste-deroulante',
    ) as HTMLElement & {
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

  it('rend un contenu statique en sortie LaTeX', () => {
    setOutputLatex()

    const result = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate:
        'a) Calculer $g(1)=$%{champ1}<br>b) Calculer $g(2)=$%{champ2}',
      dataOptions: {},
    })

    expect(result).not.toContain('<multi-mathfield')
    expect(result).toContain('Calculer $g(1)=$')
    expect(result).toContain('Calculer $g(2)=$')
  })

  it('n ajoute pas le texteApres apres un champ vide en rendu statique', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: 'Quel sera le capital au bout de 3 ans ? %{champ1}',
      dataOptions: {
        champ1: { texteApres: ' euros' },
      },
      interactivityOn: false,
    })

    expect(rendu).not.toContain('<multi-mathfield')
    expect(rendu).not.toContain('euros')
  })

  it('ajoute le texteApres apres les pointilles en rendu statique', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: 'Quel sera le capital au bout de 3 ans ? %{champ1}',
      dataOptions: {
        champ1: { ldots: true, texteApres: ' euros' },
      },
      interactivityOn: false,
    })

    expect(rendu).toContain('...')
    expect(rendu).toContain('euros')
  })

  it('rend des pointilles au lieu des champs quand l interactivite est desactivee', () => {
    const rendu = MultiMathfieldElement.create({
      numeroExercice: 0,
      questionIndex: 0,
      dataTemplate: '$g(1)=$%{champ1}',
      dataOptions: {
        champ1: { ldots: true },
      },
      interactivityOn: false,
    })

    expect(rendu).not.toContain('<multi-mathfield')
    expect(rendu).toContain('...')

    const multi = document.createElement(
      'multi-mathfield',
    ) as MultiMathfieldElement
    multi.setAttribute('id', 'multi-mathfieldEx0Q0')
    multi.setAttribute('numero-exercice', '0')
    multi.setAttribute('question-index', '0')
    multi.setAttribute('interactivity-on', 'false')
    multi.setAttribute('data-template', '$g(1)=$%{champ1}')
    multi.setAttribute(
      'data-options',
      encodeURIComponent(JSON.stringify({ champ1: { ldots: true } })),
    )
    document.body.appendChild(multi)

    expect(multi.shadowRoot?.querySelector('math-field')).toBeNull()
    expect(multi.shadowRoot?.textContent).toContain('...')
  })
})
